import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import DanismanlarListeKlient from "@/components/admin/DanismanlarListeKlient";

export const metadata: Metadata = {
  title: "Danışman Listesi — Admin | MindBridger",
};

const SAYFA_BOYUTU = 20;

type Filtre = "tumu" | "aktif" | "pasif" | "bekleyen";

interface PageProps {
  searchParams: Promise<{ filtre?: string; sayfa?: string; q?: string }>;
}

export default async function AdminDanismanlarPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) redirect("/giris");

  const params = await searchParams;
  const filtre: Filtre =
    params.filtre === "aktif" ||
    params.filtre === "pasif" ||
    params.filtre === "bekleyen"
      ? params.filtre
      : "tumu";
  const sayfa = Math.max(1, parseInt(params.sayfa ?? "1", 10));
  const q = params.q?.trim() ?? "";

  // Temel sorgu: danisanlar + profiles join
  let query = supabase
    .from("danisanlar")
    .select(
      `
      id,
      title,
      city,
      average_rating,
      total_sessions,
      profile_published,
      updated_at,
      slug,
      specialties,
      profiles!danisanlar_profile_id_fkey (
        id,
        first_name,
        last_name,
        status
      )
    `,
      { count: "exact" }
    )
    .is("deleted_at", null);

  // Filtre uygula
  if (filtre === "aktif") {
    query = query.eq("profile_published", true).eq("profiles.status", "active");
  } else if (filtre === "pasif") {
    query = query.eq("profile_published", false);
  } else if (filtre === "bekleyen") {
    query = query.eq("profiles.status", "pending");
  }

  // Arama
  if (q) {
    query = query.ilike("profiles.last_name", `%${q}%`);
  }

  // Sayfalama
  const baslangic = (sayfa - 1) * SAYFA_BOYUTU;
  const { data, count, error } = await query
    .order("updated_at", { ascending: false })
    .range(baslangic, baslangic + SAYFA_BOYUTU - 1);

  if (error) {
    console.error("[AdminDanismanlar] Supabase error:", error.message);
  }

  const toplamSayfa = Math.ceil((count ?? 0) / SAYFA_BOYUTU);

  return (
    <DanismanlarListeKlient
      danismanlar={data ?? []}
      toplamSayfa={toplamSayfa}
      toplamKayit={count ?? 0}
      mevcutSayfa={sayfa}
      mevcutFiltre={filtre}
      mevcutQ={q}
    />
  );
}
