import "server-only";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import type { IstatistikVeri } from "@/types/admin";

const OFFSET_MS = 3 * 60 * 60 * 1000; // UTC+3

function utc3DateStr(date: Date): string {
  return new Date(date.getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

function formatGMY(isoStr: string): string {
  const d = new Date(new Date(isoStr).getTime() + OFFSET_MS);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yy = String(d.getUTCFullYear()).slice(-2);
  return `${dd}.${mm}.${yy}`;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const gunParam = req.nextUrl.searchParams.get("gun");
  const gun: 7 | 30 | 90 = gunParam === "7" ? 7 : gunParam === "90" ? 90 : 30;

  const now = new Date();
  const nowUTC3 = new Date(now.getTime() + OFFSET_MS);
  const todayStr = utc3DateStr(now);
  const yesterdayStr = utc3DateStr(new Date(now.getTime() - 86_400_000));
  const chartStart = new Date(now.getTime() - gun * 86_400_000);

  // Monday of current week (UTC+3)
  const dow = nowUTC3.getUTCDay();
  const daysFromMon = dow === 0 ? 6 : dow - 1;
  const weekStartStr = utc3DateStr(new Date(now.getTime() - daysFromMon * 86_400_000));

  try {
    const [
      randevularRes,
      onayCountRes,
      weekPaymentsRes,
      payoutsRes,
      grafikRes,
      pendingProfilesRes,
      pendingBlogsRes,
    ] = await Promise.all([
      // Today + yesterday randevular
      supabase
        .from("randevular")
        .select("scheduled_at")
        .gte("scheduled_at", `${yesterdayStr}T00:00:00+03:00`)
        .lte("scheduled_at", `${todayStr}T23:59:59+03:00`)
        .in("status", ["pending", "confirmed", "completed"])
        .is("deleted_at", null),

      // Pending danışman count
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "danisan")
        .eq("status", "pending")
        .is("deleted_at", null),

      // This week payments
      supabase
        .from("payments")
        .select("amount_gross, commission_amount")
        .eq("status", "captured")
        .gte("paid_at", `${weekStartStr}T00:00:00+03:00`)
        .is("deleted_at", null),

      // Pending payouts
      supabase
        .from("payouts")
        .select("total_amount, danisan_id")
        .eq("status", "pending")
        .is("deleted_at", null),

      // Chart randevular
      supabase
        .from("randevular")
        .select("scheduled_at")
        .gte("scheduled_at", chartStart.toISOString())
        .in("status", ["pending", "confirmed", "completed"])
        .is("deleted_at", null),

      // Pending danışman profiles (top 5)
      supabase
        .from("profiles")
        .select("id, first_name, last_name, created_at")
        .eq("role", "danisan")
        .eq("status", "pending")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5),

      // Pending blog posts (top 5)
      supabase
        .from("blog_posts")
        .select("id, title, created_at, status, danisan_id")
        .in("status", ["pending", "draft"])
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    // ── KPI 1: today vs yesterday ──────────────────────────
    const todayStartMs = new Date(`${todayStr}T00:00:00+03:00`).getTime();
    const yestStartMs = new Date(`${yesterdayStr}T00:00:00+03:00`).getTime();
    const allRandevular = randevularRes.data ?? [];
    const bugunRandevular = allRandevular.filter(
      (r) => new Date(r.scheduled_at).getTime() >= todayStartMs,
    ).length;
    const dunRandevular = allRandevular.filter((r) => {
      const t = new Date(r.scheduled_at).getTime();
      return t >= yestStartMs && t < todayStartMs;
    }).length;

    // ── KPI 3 & 4 ──────────────────────────────────────────
    const weekPayments = weekPaymentsRes.data ?? [];
    const haftaGeliri = weekPayments.reduce((s, p) => s + p.amount_gross, 0);
    const haftaKomisyon = weekPayments.reduce((s, p) => s + p.commission_amount, 0);

    // ── KPI 5 ──────────────────────────────────────────────
    const payouts = payoutsRes.data ?? [];
    const bekleyenTransferTutar = payouts.reduce((s, p) => s + p.total_amount, 0);
    const bekleyenTransferDanisanSayisi = new Set(payouts.map((p) => p.danisan_id)).size;

    // ── Chart: group by UTC+3 date ─────────────────────────
    const tarihMap = new Map<string, number>();
    for (const r of grafikRes.data ?? []) {
      const k = utc3DateStr(new Date(r.scheduled_at));
      tarihMap.set(k, (tarihMap.get(k) ?? 0) + 1);
    }
    const seansGrafik = Array.from({ length: gun }, (_, i) => {
      const d = new Date(now.getTime() - (gun - 1 - i) * 86_400_000);
      const k = utc3DateStr(d);
      const dUTC3 = new Date(d.getTime() + OFFSET_MS);
      const dow2 = dUTC3.getUTCDay();
      const dd = String(dUTC3.getUTCDate()).padStart(2, "0");
      const mo = String(dUTC3.getUTCMonth() + 1).padStart(2, "0");
      return {
        tarih: `${dd}.${mo}`,
        adet: tarihMap.get(k) ?? 0,
        haftaSonu: dow2 === 0 || dow2 === 6,
      };
    });

    // ── Pending applications: secondary lookup ─────────────
    const profileIds = (pendingProfilesRes.data ?? []).map((p) => p.id);
    const danisanTitleMap = new Map<string, string>();
    if (profileIds.length > 0) {
      const { data: danisanlar } = await supabase
        .from("danisanlar")
        .select("profile_id, title")
        .in("profile_id", profileIds)
        .is("deleted_at", null);
      for (const d of danisanlar ?? []) {
        danisanTitleMap.set(d.profile_id, d.title ?? "Belirtilmemiş");
      }
    }

    const bekleyenBasvurular: IstatistikVeri["bekleyenBasvurular"] = (
      pendingProfilesRes.data ?? []
    ).map((p) => ({
      id: p.id,
      adSoyad: [p.first_name, p.last_name].filter(Boolean).join(" ") || "—",
      uzmanlik: danisanTitleMap.get(p.id) ?? "Belirtilmemiş",
      basvuruTarihi: formatGMY(p.created_at),
      durum: "Yeni",
    }));

    // ── Pending blogs: secondary lookup ────────────────────
    const blogDanisanIds = [
      ...new Set(
        (pendingBlogsRes.data ?? [])
          .map((b) => b.danisan_id)
          .filter((id): id is string => id !== null)
      ),
    ];
    const blogNameMap = new Map<string, string>();
    if (blogDanisanIds.length > 0) {
      const { data: danisanlar } = await supabase
        .from("danisanlar")
        .select("id, profile_id")
        .in("id", blogDanisanIds)
        .is("deleted_at", null);
      const pIds = (danisanlar ?? []).map((d) => d.profile_id);
      if (pIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", pIds);
        const pMap = new Map((profiles ?? []).map((p) => [p.id, p]));
        for (const d of danisanlar ?? []) {
          const p = pMap.get(d.profile_id);
          blogNameMap.set(
            d.id,
            p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || "—" : "—",
          );
        }
      }
    }

    const bekleyenBloglar: IstatistikVeri["bekleyenBloglar"] = (
      pendingBlogsRes.data ?? []
    ).map((b) => ({
      id: b.id,
      baslik: b.title,
      danisanAdi: b.danisan_id ? (blogNameMap.get(b.danisan_id) ?? "—") : "Admin",
      gonderiTarihi: formatGMY(b.created_at),
      durum: b.status === "pending" ? "İncelemede" : b.status === "draft" ? "Taslak" : "Yeni",
    }));

    const veri: IstatistikVeri = {
      kpi: {
        bugunRandevular,
        bugunDegisim: bugunRandevular - dunRandevular,
        bekleyenOnaylar: onayCountRes.count ?? 0,
        haftaGeliri,
        haftaGeliriHedef: 50_000,
        haftaKomisyon,
        bekleyenTransferTutar,
        bekleyenTransferDanisanSayisi,
      },
      seansGrafik,
      bekleyenBasvurular,
      bekleyenBloglar,
      guncellemeTarihi: new Date().toISOString(),
    };

    return Response.json(veri);
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
