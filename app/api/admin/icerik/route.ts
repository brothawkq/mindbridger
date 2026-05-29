import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import type {
  AdminIcerikResponse,
  BlogSatir,
  TestSatir,
  KaynaklarSatir,
  SssSatir,
  WebinarSatir,
} from "@/types/admin";

const PAGE_SIZE = 20;
type IcerikTab = "blog" | "testler" | "kaynaklar" | "sss" | "webinarlar";
const VALID_TABS: IcerikTab[] = ["blog", "testler", "kaynaklar", "sss", "webinarlar"];

function fmt(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()}`;
}

function adSoyad(fn: string | null, ln: string | null) {
  return `${fn ?? ""} ${ln ?? ""}`.trim() || "(adsız)";
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const rawTab = searchParams.get("tab") ?? "blog";
  const tab = (VALID_TABS.includes(rawTab as IcerikTab) ? rawTab : "blog") as IcerikTab;
  const sayfa = Math.max(1, parseInt(searchParams.get("sayfa") ?? "1", 10));
  const durum = searchParams.get("durum") ?? "";
  const offset = (sayfa - 1) * PAGE_SIZE;

  let blog: BlogSatir[] = [];
  let testler: TestSatir[] = [];
  let kaynaklar: KaynaklarSatir[] = [];
  let sss: SssSatir[] = [];
  let webinarlar: WebinarSatir[] = [];
  let toplam = 0;

  // ── Blog ────────────────────────────────────────────────────
  if (tab === "blog") {
    let q = supabase
      .from("blog_posts")
      .select(
        "id, title, slug, status, danisan_id, published_at, view_count, rejection_reason",
        { count: "exact" }
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (durum) q = q.eq("status", durum as "draft" | "pending" | "published" | "rejected");

    const { data: rawBlog, count } = await q;
    toplam = count ?? 0;

    const dIds = [
      ...new Set((rawBlog ?? []).map((b) => b.danisan_id).filter(Boolean)),
    ] as string[];
    type DRow = { id: string; profile_id: string | null };
    let danisanRows: DRow[] = [];
    if (dIds.length > 0) {
      const { data } = await supabase
        .from("danisanlar")
        .select("id, profile_id")
        .in("id", dIds)
        .is("deleted_at", null);
      danisanRows = (data as DRow[]) ?? [];
    }
    const danProfileIds = [
      ...new Set(danisanRows.map((d) => d.profile_id).filter(Boolean)),
    ] as string[];
    type PRow = { id: string; first_name: string | null; last_name: string | null };
    let danisanProfiles: PRow[] = [];
    if (danProfileIds.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", danProfileIds);
      danisanProfiles = (data as PRow[]) ?? [];
    }
    const dProfMap = new Map(
      danisanProfiles.map((p) => [p.id, adSoyad(p.first_name, p.last_name)])
    );
    const dMap = new Map(
      danisanRows.map((d) => [
        d.id,
        d.profile_id ? (dProfMap.get(d.profile_id) ?? "(adsız)") : "(adsız)",
      ])
    );

    blog = (rawBlog ?? []).map((b) => ({
      id: b.id,
      baslik: b.title ?? "(Başlıksız)",
      slug: b.slug ?? "",
      durum: (b.status ?? "draft") as BlogSatir["durum"],
      danisanAdi: b.danisan_id ? (dMap.get(b.danisan_id) ?? "(adsız)") : "—",
      yayinTarihi: b.published_at ? fmt(b.published_at) : null,
      goruntuleme: Number(b.view_count ?? 0),
      redGerekce: b.rejection_reason ?? null,
    }));
  }

  // ── Testler ─────────────────────────────────────────────────
  if (tab === "testler") {
    const { data: rawTests, count } = await supabase
      .from("psikolojik_testler")
      .select("id, title, slug, description, is_active, estimated_minutes", { count: "exact" })
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    toplam = count ?? 0;
    testler = (rawTests ?? []).map((t) => ({
      id: t.id,
      baslik: t.title ?? "(Başlıksız)",
      slug: t.slug ?? "",
      aciklama: t.description ?? "",
      aktif: t.is_active ?? false,
      sureme: t.estimated_minutes ?? null,
    }));
  }

  // ── Kaynaklar ────────────────────────────────────────────────
  if (tab === "kaynaklar") {
    const { data: rawKaynaklar, count } = await supabase
      .from("kaynaklar")
      .select("id, title, type, category, is_active", { count: "exact" })
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    toplam = count ?? 0;
    kaynaklar = (rawKaynaklar ?? []).map((k) => ({
      id: k.id,
      baslik: k.title ?? "(Başlıksız)",
      tip: (k.type ?? "link") as KaynaklarSatir["tip"],
      kategori: (k.category as string[]) ?? [],
      aktif: k.is_active ?? false,
    }));
  }

  // ── SSS ──────────────────────────────────────────────────────
  if (tab === "sss") {
    const { data: rawSss, count } = await supabase
      .from("faq")
      .select("id, question, answer, category, order, is_active", { count: "exact" })
      .is("deleted_at", null)
      .order("order", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    toplam = count ?? 0;
    sss = (rawSss ?? []).map((f) => ({
      id: f.id,
      soru: f.question ?? "",
      cevap: f.answer ?? "",
      kategori: f.category ?? "",
      sira: f.order ?? 0,
      aktif: f.is_active ?? false,
    }));
  }

  // ── Webinarlar ───────────────────────────────────────────────
  if (tab === "webinarlar") {
    let q = supabase
      .from("webinarlar")
      .select(
        "id, title, host_id, scheduled_at, duration_minutes, price, capacity, registered_count, status",
        { count: "exact" }
      )
      .is("deleted_at", null)
      .order("scheduled_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (durum) q = q.eq("status", durum as "draft" | "published" | "cancelled" | "completed");

    const { data: rawWeb, count } = await q;
    toplam = count ?? 0;

    const hostIds = [
      ...new Set((rawWeb ?? []).map((w) => w.host_id).filter(Boolean)),
    ] as string[];
    type PRow = { id: string; first_name: string | null; last_name: string | null };
    let hostProfiles: PRow[] = [];
    if (hostIds.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", hostIds);
      hostProfiles = (data as PRow[]) ?? [];
    }
    const hostMap = new Map(
      hostProfiles.map((p) => [p.id, adSoyad(p.first_name, p.last_name)])
    );

    webinarlar = (rawWeb ?? []).map((w) => ({
      id: w.id,
      baslik: w.title ?? "(Başlıksız)",
      sunucu: w.host_id ? (hostMap.get(w.host_id) ?? "(adsız)") : "—",
      tarih: fmt(w.scheduled_at),
      sure: w.duration_minutes ?? null,
      fiyat: Number(w.price ?? 0),
      kapasite: Number(w.capacity ?? 0),
      kayitli: Number(w.registered_count ?? 0),
      durum: (w.status ?? "draft") as WebinarSatir["durum"],
    }));
  }

  const toplamSayfa = Math.max(1, Math.ceil(toplam / PAGE_SIZE));
  const body: AdminIcerikResponse = {
    blog,
    testler,
    kaynaklar,
    sss,
    webinarlar,
    toplam,
    sayfa,
    toplamSayfa,
  };
  return NextResponse.json(body);
}
