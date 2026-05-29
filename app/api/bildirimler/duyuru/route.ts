/**
 * POST /api/bildirimler/duyuru
 * Admin toplu duyuru gönderimi.
 *
 * Body:
 *   title        — duyuru başlığı (zorunlu)
 *   body         — duyuru metni (opsiyonel)
 *   hedef        — "herkes" | "musteri" | "danisan" | "kurumsal"
 *   kanal        — "app" | "email" | "hepsi"  (varsayılan: "app")
 *   emailHtml    — kanal="email"|"hepsi" ise zorunlu
 *   emailKonu    — e-posta konu satırı
 *
 * 500+ alıcı için cursor-tabanlı batch işlem (100'erlik) kullanır.
 * Hata fırlatmaz; başarısız gönderimleri sayar ve döner.
 */
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import { bildirimGonder } from "@/lib/bildirim/gonder";
import { z } from "zod";

const duyuruSchema = z.object({
  title:      z.string().min(3).max(200),
  body:       z.string().max(500).optional(),
  hedef:      z.enum(["herkes", "musteri", "danisan", "kurumsal"]),
  kanal:      z.enum(["app", "email", "hepsi"]).default("app"),
  emailHtml:  z.string().optional(),
  emailKonu:  z.string().optional(),
});

const BATCH_BOYUTU = 100;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const user = await requireRole(supabase, ["admin"]);
    if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

    const body = await req.json();
    const parsed = duyuruSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Geçersiz veri", details: parsed.error.issues }, { status: 400 });
    }

    const { title, body: icerik, hedef, kanal, emailHtml, emailKonu } = parsed.data;

    // E-posta kanalı için HTML zorunlu
    if ((kanal === "email" || kanal === "hepsi") && !emailHtml) {
      return Response.json({ error: "E-posta kanalı için emailHtml zorunlu" }, { status: 400 });
    }

    // Hedef kullanıcıları al — cursor-tabanlı batch
    let toplam = 0;
    let basarili = 0;
    let basarisiz = 0;
    let lastId: string | null = null;

    while (true) {
      let query = supabase
        .from("profiles")
        .select("id")
        .eq("status", "active")
        .is("deleted_at", null)
        .order("id", { ascending: true })
        .limit(BATCH_BOYUTU);

      if (hedef !== "herkes") {
        const rolMap: Record<string, string> = {
          musteri: "musteri",
          danisan: "danisan",
          kurumsal: "kurumsal",
        };
        const rol = rolMap[hedef];
        if (rol) query = query.eq("role", rol as "musteri" | "danisan" | "kurumsal");
      }

      if (lastId) query = query.gt("id", lastId);

      const { data: kullanicilar } = await query;

      if (!kullanicilar || kullanicilar.length === 0) break;

      for (const k of kullanicilar) {
        toplam++;
        const sonuc = await bildirimGonder({
          userId: k.id,
          title,
          body: icerik,
          type: "pazarlama",
          emailHtml: kanal !== "app" ? emailHtml : undefined,
          emailKonu: emailKonu ?? title,
          kanalZorla: kanal === "hepsi" ? "hepsi" : kanal === "email" ? "email" : "app",
          data: { duyuru: true },
        });

        if (sonuc.ok) basarili++;
        else basarisiz++;
      }

      // Son batch boyutundan az gelirse döngü bitti
      if (kullanicilar.length < BATCH_BOYUTU) break;
      lastId = kullanicilar[kullanicilar.length - 1]?.id ?? null;
    }

    // Audit log — expires_at zorunlu; new_values Json alanına detaylar
    const bitisTarihi = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const duyuruDetay = { title, hedef, kanal, toplam, basarili, basarisiz } as any;
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "admin_duyuru",
      expires_at: bitisTarihi,
      new_values: duyuruDetay,
    });

    return Response.json({
      ok: true,
      toplam,
      basarili,
      basarisiz,
    });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
