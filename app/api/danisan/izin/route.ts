import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import { z } from "zod";

const PostSchema = z.object({
  tarih: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz tarih formatı."),
  reason: z.string().max(200).optional(),
});

async function getDanisanId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("danisanlar")
    .select("id")
    .eq("profile_id", userId)
    .is("deleted_at", null)
    .single();
  return data?.id ?? null;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const danisanId = await getDanisanId(supabase, user.id);
  if (!danisanId)
    return NextResponse.json({ hata: "Danışman kaydı bulunamadı." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { hata: parsed.error.issues[0]?.message ?? "Geçersiz veri." },
      { status: 400 }
    );

  const { tarih, reason } = parsed.data;

  // Geçmiş tarih kontrolü
  const today = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().split("T")[0]!;
  if (tarih < today)
    return NextResponse.json({ hata: "Geçmiş bir tarih için izin eklenemez." }, { status: 400 });

  // Mükerrer kayıt kontrolü
  const { data: existing } = await supabase
    .from("danisan_izin")
    .select("id")
    .eq("danisan_id", danisanId)
    .eq("date", tarih)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing)
    return NextResponse.json({ hata: "Bu tarih zaten kapalı olarak işaretli." }, { status: 409 });

  await supabase.from("danisan_izin").insert({
    danisan_id: danisanId,
    date: tarih,
    reason: reason ?? null,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const danisanId = await getDanisanId(supabase, user.id);
  if (!danisanId)
    return NextResponse.json({ hata: "Danışman kaydı bulunamadı." }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const tarih = searchParams.get("tarih");
  if (!tarih)
    return NextResponse.json({ hata: "Tarih parametresi gerekli." }, { status: 400 });

  await supabase
    .from("danisan_izin")
    .update({ deleted_at: new Date().toISOString() })
    .eq("danisan_id", danisanId)
    .eq("date", tarih)
    .is("deleted_at", null);

  return NextResponse.json({ ok: true });
}
