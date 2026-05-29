import "server-only";
import { z } from "zod";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

const PatchSchema = z.object({
  id: z.string().uuid(),
  shared: z.boolean(),
  danisan_id: z.string().uuid().optional(),
});

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 422 });
  }

  const { id, shared, danisan_id } = parsed.data;

  if (shared && !danisan_id) {
    return NextResponse.json(
      { error: "Paylaşım için danışman seçilmeli" },
      { status: 422 }
    );
  }

  const { data: kayit, error } = await supabase
    .from("gunluk_kayitlar")
    .update({
      shared_with_danisan_id: shared ? (danisan_id ?? null) : null,
    })
    .eq("id", id)
    .eq("musteri_id", user.id)
    .is("deleted_at", null)
    .select()
    .single();

  if (error || !kayit) {
    return NextResponse.json(
      { error: "Güncelleme sırasında hata oluştu" },
      { status: 500 }
    );
  }

  return NextResponse.json({ kayit });
}
