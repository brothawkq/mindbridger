import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const settingKey = formData.get("key") as string | null;

  if (!file || !settingKey) {
    return Response.json({ error: "Dosya ve key zorunlu" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: "10 MB limitini aşıyor" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: "Geçersiz dosya türü" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${settingKey}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { data: up, error: upErr } = await supabase.storage
    .from("site-images")
    .upload(filename, buffer, { contentType: file.type, upsert: true });

  if (upErr) return Response.json({ error: upErr.message }, { status: 500 });

  const { data: urlData } = supabase.storage
    .from("site-images")
    .getPublicUrl(up.path);

  const { error: sErr } = await supabase
    .from("site_settings")
    .upsert({ key: settingKey, value: urlData.publicUrl, updated_at: new Date().toISOString() });

  if (sErr) return Response.json({ error: sErr.message }, { status: 500 });

  return Response.json({ url: urlData.publicUrl });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

  const key = new URL(request.url).searchParams.get("key");
  if (!key) return Response.json({ error: "key zorunlu" }, { status: 400 });

  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .single();

  if (data?.value) {
    const base = supabase.storage.from("site-images").getPublicUrl("").data.publicUrl;
    const path = data.value.replace(base.replace(/\/$/, "") + "/", "");
    if (path) await supabase.storage.from("site-images").remove([path]);
  }

  await supabase.from("site_settings").update({ value: "" }).eq("key", key);

  return Response.json({ ok: true });
}
