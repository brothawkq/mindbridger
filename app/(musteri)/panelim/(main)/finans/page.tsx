import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import FinansKlient, {
  type MusteriOdeme,
} from "@/components/musteri/FinansKlient";

export const metadata = { title: "Finansal Geçmiş | MindBridger" };

export default async function FinansPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) redirect("/giris");

  // Payments (captured only)
  const { data: odemelerRaw } = await supabase
    .from("payments")
    .select("id, amount_gross, status, paid_at, created_at, randevu_id, danisan_id")
    .eq("musteri_id", user.id)
    .eq("status", "captured")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const odemeler = odemelerRaw ?? [];

  // Invoices for these payments
  const odemeIds = odemeler.map((o) => o.id);
  let faturaMap = new Map<string, { id: string; invoice_number: string; pdf_url: string | null }>();

  if (odemeIds.length > 0) {
    const { data: faturalar } = await supabase
      .from("seans_faturalari")
      .select("id, payment_id, invoice_number, pdf_url")
      .in("payment_id", odemeIds)
      .is("deleted_at", null);

    faturaMap = new Map(
      (faturalar ?? [])
        .filter((f) => f.payment_id !== null)
        .map((f) => [
          f.payment_id as string,
          { id: f.id, invoice_number: f.invoice_number, pdf_url: f.pdf_url },
        ])
    );
  }

  // Randevu dates
  const randevuIds = odemeler.map((o) => o.randevu_id);
  let randevuMap = new Map<string, string>();

  if (randevuIds.length > 0) {
    const { data: randevular } = await supabase
      .from("randevular")
      .select("id, scheduled_at")
      .in("id", randevuIds);

    randevuMap = new Map(
      (randevular ?? []).map((r) => [r.id, r.scheduled_at])
    );
  }

  // Danisan names
  const danisanIds = [...new Set(odemeler.map((o) => o.danisan_id))];
  let danisanIsimMap = new Map<string, string>();
  let danisanSlugMap = new Map<string, string>();

  if (danisanIds.length > 0) {
    const { data: danisanlar } = await supabase
      .from("danisanlar")
      .select("id, profile_id, slug")
      .in("id", danisanIds);

    const profileIds = (danisanlar ?? []).map((d) => d.profile_id);
    if (profileIds.length > 0) {
      const { data: profiller } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", profileIds);

      const profilMap = new Map(
        (profiller ?? []).map((p) => [
          p.id,
          `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
        ])
      );

      danisanIsimMap = new Map(
        (danisanlar ?? []).map((d) => [
          d.id,
          profilMap.get(d.profile_id) ?? "Danışman",
        ])
      );
      danisanSlugMap = new Map(
        (danisanlar ?? []).map((d) => [d.id, d.slug ?? ""])
      );
    }
  }

  const zenginOdemeler: MusteriOdeme[] = odemeler.map((o) => {
    const fatura = faturaMap.get(o.id);
    return {
      id: o.id,
      amount_gross: o.amount_gross,
      status: o.status,
      paid_at: o.paid_at,
      created_at: o.created_at,
      randevu_tarih: randevuMap.get(o.randevu_id) ?? null,
      danisan_isim: danisanIsimMap.get(o.danisan_id) ?? "Danışman",
      danisan_slug: danisanSlugMap.get(o.danisan_id) ?? "",
      fatura_id: fatura?.id ?? null,
      invoice_number: fatura?.invoice_number ?? null,
      pdf_url: fatura?.pdf_url ?? null,
    };
  });

  const toplamOdenen = zenginOdemeler.reduce((s, o) => s + o.amount_gross, 0);
  const toplamFatura = [...faturaMap.values()].length;

  return (
    <>
      <div className="bg-[#F5F7F5] dark:bg-[#1a1a1a] border-b-[1.5px] border-[#325343] dark:border-white px-3.5 py-1.5 flex items-center gap-2.5 flex-wrap">
        <span className="text-[12px] font-bold text-[#252625] dark:text-white whitespace-nowrap">
          Finansal Geçmiş
        </span>
        <span className="text-[10px] font-semibold border-[1.5px] border-[#325343] dark:border-white px-[7px] py-[1px] bg-white dark:bg-transparent text-[#252625] dark:text-white whitespace-nowrap">
          Müşteri
        </span>
        <span className="text-[10.5px] text-[#4A4D4A] italic border-b border-dotted border-[#BDBDBD] pb-[1px]">
          Geçmiş ödemeler ve fatura indirme
        </span>
      </div>

      <div className="overflow-y-auto flex-1">
        <FinansKlient
          odemeler={zenginOdemeler}
          toplamOdenen={toplamOdenen}
          toplamSeans={zenginOdemeler.length}
          toplamFatura={toplamFatura}
        />
      </div>
    </>
  );
}
