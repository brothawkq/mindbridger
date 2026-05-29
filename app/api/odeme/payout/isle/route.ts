import "server-only";
import { type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireRole";

const bodySchema = z.object({
  donem_baslangic: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  donem_bitis: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireAuth(supabase);
  if (!user || user.role !== "admin") {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  const { donem_baslangic, donem_bitis } = parsed.data;

  try {
    // Dönem içinde captured ödeme olan danışmanları bul (daha önce payout yapılmamış)
    const { data: odemeler, error: odemeHata } = await supabase
      .from("payments")
      .select("id, danisan_id, amount_net")
      .eq("status", "captured")
      .gte("paid_at", `${donem_baslangic}T00:00:00Z`)
      .lte("paid_at", `${donem_bitis}T23:59:59Z`)
      .is("deleted_at", null);

    if (odemeHata || !odemeler) {
      return Response.json({ error: "Ödemeler alınamadı" }, { status: 500 });
    }

    if (odemeler.length === 0) {
      return Response.json({ mesaj: "Bu dönem için ödeme bulunamadı", payoutlar: [] });
    }

    // Mevcut payout kayıtlarını al (aynı dönem için duplicate önle)
    const { data: mevcutPayoutlar } = await supabase
      .from("payouts")
      .select("danisan_id")
      .eq("period_start", donem_baslangic)
      .eq("period_end", donem_bitis);

    const mevcutDanisanlar = new Set((mevcutPayoutlar ?? []).map((p) => p.danisan_id));

    // Danışman bazında gruplama
    const danisanMap = new Map<string, { toplam: number; odemeIdleri: string[] }>();
    for (const odeme of odemeler) {
      if (mevcutDanisanlar.has(odeme.danisan_id)) continue; // zaten payout yapılmış
      const mevcut = danisanMap.get(odeme.danisan_id) ?? { toplam: 0, odemeIdleri: [] };
      mevcut.toplam = Math.round((mevcut.toplam + odeme.amount_net) * 100) / 100;
      mevcut.odemeIdleri.push(odeme.id);
      danisanMap.set(odeme.danisan_id, mevcut);
    }

    if (danisanMap.size === 0) {
      return Response.json({ mesaj: "Tüm danışmanlar bu dönem için payout aldı", payoutlar: [] });
    }

    const payoutInserts = Array.from(danisanMap.entries()).map(([danisan_id, bilgi]) => ({
      danisan_id,
      period_start: donem_baslangic,
      period_end: donem_bitis,
      total_amount: bilgi.toplam,
      payment_ids: bilgi.odemeIdleri,
      status: "pending" as const,
    }));

    const { data: olusturulan, error: payoutHata } = await supabase
      .from("payouts")
      .insert(payoutInserts)
      .select("id, danisan_id, total_amount, status");

    if (payoutHata) {
      // 23505: unique_violation — eşzamanlı istek bu dönemi zaten işledi
      if ((payoutHata as { code?: string }).code === "23505") {
        return Response.json(
          { error: "Bu dönem için payout zaten oluşturuluyor, lütfen tekrar deneyin" },
          { status: 409 },
        );
      }
      return Response.json({ error: "Payout kayıtları oluşturulamadı" }, { status: 500 });
    }

    return Response.json({
      basarili: true,
      olusturulan_payout_sayisi: olusturulan?.length ?? 0,
      payoutlar: olusturulan,
    });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
