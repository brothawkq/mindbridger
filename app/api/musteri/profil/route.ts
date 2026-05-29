import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

const ProfilGuncelleSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  dark_mode: z.boolean().optional(),
  notification_channel: z.enum(["email", "sms", "uygulama_ici"]).optional(),
});

export async function GET() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) return NextResponse.json({ hata: "Yetkisiz." }, { status: 401 });

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "first_name, last_name, phone, dark_mode, notification_channel, kvkk_accepted_at, created_at"
    )
    .eq("id", user.id)
    .single();

  if (error) return NextResponse.json({ hata: "Profil yüklenemedi." }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) return NextResponse.json({ hata: "Yetkisiz." }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const parsed = ProfilGuncelleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ hata: parsed.error.issues[0]?.message ?? "Geçersiz veri." }, { status: 400 });
  }

  const { first_name, last_name, phone, dark_mode, notification_channel } = parsed.data;

  const { error } = await supabase
    .from("profiles")
    .update({
      ...(first_name !== undefined && { first_name }),
      ...(last_name !== undefined && { last_name }),
      ...(phone !== undefined && { phone }),
      ...(dark_mode !== undefined && { dark_mode }),
      ...(notification_channel !== undefined && { notification_channel }),
    })
    .eq("id", user.id);

  if (error) return NextResponse.json({ hata: "Profil güncellenemedi." }, { status: 500 });
  return NextResponse.json({ basarili: true });
}
