import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import { z } from "zod";

const SlotSchema = z.object({
  gun: z.number().int().min(0).max(6),
  baslangic: z.string().regex(/^\d{2}:\d{2}$/, "Geçersiz başlangıç saati."),
  bitis: z.string().regex(/^\d{2}:\d{2}$/, "Geçersiz bitiş saati."),
});

const PutSchema = z.object({
  slotlar: z.array(SlotSchema).max(50),
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

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const danisanId = await getDanisanId(supabase, user.id);
  if (!danisanId)
    return NextResponse.json({ hata: "Danışman kaydı bulunamadı." }, { status: 404 });

  const { data: slotlar } = await supabase
    .from("danisan_musaitlik")
    .select("id, day_of_week, start_time, end_time")
    .eq("danisan_id", danisanId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  return NextResponse.json({
    slotlar: (slotlar ?? []).map((s) => ({
      id: s.id,
      gun: s.day_of_week,
      baslangic: (s.start_time as string).substring(0, 5),
      bitis: (s.end_time as string).substring(0, 5),
    })),
  });
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const danisanId = await getDanisanId(supabase, user.id);
  if (!danisanId)
    return NextResponse.json({ hata: "Danışman kaydı bulunamadı." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = PutSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { hata: parsed.error.issues[0]?.message ?? "Geçersiz veri." },
      { status: 400 }
    );

  const { slotlar } = parsed.data;

  // Validate start < end for each slot
  for (const slot of slotlar) {
    const [sh = 0, sm = 0] = slot.baslangic.split(":").map(Number);
    const [eh = 0, em = 0] = slot.bitis.split(":").map(Number);
    if (sh * 60 + sm >= eh * 60 + em)
      return NextResponse.json(
        { hata: "Başlangıç saati bitiş saatinden önce olmalı." },
        { status: 400 }
      );
  }

  // Soft-delete existing active slots
  await supabase
    .from("danisan_musaitlik")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("danisan_id", danisanId)
    .is("deleted_at", null);

  // Insert new slots
  if (slotlar.length > 0) {
    await supabase.from("danisan_musaitlik").insert(
      slotlar.map((s) => ({
        danisan_id: danisanId,
        day_of_week: s.gun,
        start_time: s.baslangic + ":00",
        end_time: s.bitis + ":00",
        is_active: true,
      }))
    );
  }

  return NextResponse.json({ ok: true });
}
