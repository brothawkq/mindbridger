import "server-only"
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireRole";
import { z } from "zod";

const odevSchema = z.object({
  musteri_id: z.string().uuid(),
  randevu_id: z.string().uuid().optional(),
  title: z.string().min(1, "Başlık zorunlu").max(200),
  description: z.string().max(2000).optional(),
  due_date: z.string().optional(),
});

export async function GET(req: Request) {
  const supabase = await createClient();
  const user = await requireAuth(supabase);
  if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

  const url = new URL(req.url);
  const durum = url.searchParams.get("durum");
  const sayfa = parseInt(url.searchParams.get("sayfa") ?? "1");
  const PAGE_SIZE = 20;

  let query = supabase
    .from("odevler")
    .select(`
      id, title, description, due_date, status, completed_at, musteri_note, file_url, created_at, randevu_id,
      profiles:musteri_id(first_name, last_name, avatar_url),
      danisan:danisan_id(profile_id)
    `, { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range((sayfa - 1) * PAGE_SIZE, sayfa * PAGE_SIZE - 1);

  if (user.role === "danisan") {
    const { data: danisanRow } = await supabase
      .from("danisanlar")
      .select("id")
      .eq("profile_id", user.id)
      .is("deleted_at", null)
      .single();
    if (!danisanRow) return Response.json({ error: "Danışman profili bulunamadı" }, { status: 404 });
    query = query.eq("danisan_id", danisanRow.id);
  } else if (user.role === "musteri") {
    query = query.eq("musteri_id", user.id);
  } else {
    return Response.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const GECERLI_DURUMLAR = ["pending", "completed", "skipped"] as const;
  type OdevDurum = typeof GECERLI_DURUMLAR[number];
  function isOdevDurum(v: string): v is OdevDurum {
    return (GECERLI_DURUMLAR as readonly string[]).includes(v);
  }
  if (durum && isOdevDurum(durum)) {
    query = query.eq("status", durum);
  }

  const { data: odevler, count, error } = await query;
  if (error) return Response.json({ error: "Ödevler yüklenemedi" }, { status: 500 });

  return Response.json({ odevler: odevler ?? [], toplam: count ?? 0, sayfa, PAGE_SIZE });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const user = await requireAuth(supabase);
  if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });
  if (user.role !== "danisan") return Response.json({ error: "Sadece danışmanlar ödev gönderebilir" }, { status: 403 });

  const { data: danisanRow } = await supabase
    .from("danisanlar")
    .select("id")
    .eq("profile_id", user.id)
    .is("deleted_at", null)
    .single();
  if (!danisanRow) return Response.json({ error: "Danışman profili bulunamadı" }, { status: 404 });

  try {
    const body = await req.json();
    const parsed = odevSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri" }, { status: 400 });
    }

    const { musteri_id, randevu_id, title, description, due_date } = parsed.data;

    if (randevu_id) {
      const { data: randevu } = await supabase
        .from("randevular")
        .select("id, musteri_id, danisan_id")
        .eq("id", randevu_id)
        .is("deleted_at", null)
        .single();
      if (!randevu) return Response.json({ error: "Randevu bulunamadı" }, { status: 404 });
      if (randevu.danisan_id !== danisanRow.id) return Response.json({ error: "Bu randevu size ait değil" }, { status: 403 });
      if (randevu.musteri_id !== musteri_id) return Response.json({ error: "Müşteri ve randevu uyuşmuyor" }, { status: 400 });
    } else {
      const { data: aktifRandevu } = await supabase
        .from("randevular")
        .select("id")
        .eq("danisan_id", danisanRow.id)
        .eq("musteri_id", musteri_id)
        .is("deleted_at", null)
        .limit(1)
        .maybeSingle();
      if (!aktifRandevu) return Response.json({ error: "Bu müşteriyle aktif randevunuz yok" }, { status: 400 });
    }

    const { data: yeniOdev, error } = await supabase
      .from("odevler")
      .insert({
        danisan_id: danisanRow.id,
        musteri_id,
        randevu_id: randevu_id ?? null,
        title,
        description: description ?? null,
        due_date: due_date ?? null,
        status: "pending",
      })
      .select("id, title, description, due_date, status, created_at")
      .single();

    if (error) return Response.json({ error: "Ödev oluşturulamadı" }, { status: 500 });

    return Response.json({ odev: yeniOdev }, { status: 201 });
  } catch {
    return Response.json({ error: "İşlem başarısız" }, { status: 500 });
  }
}
