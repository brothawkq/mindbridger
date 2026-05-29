import "server-only";
import { type SupabaseClient } from "@supabase/supabase-js";

export async function faturaNumarasiUret(supabase: SupabaseClient): Promise<string> {
  const yil = new Date().getFullYear();
  // DEN-13: count+1 yerine atomik PostgreSQL sequence kullanılır.
  // get_next_fatura_sira() → nextval('fatura_sira_seq') → çakışma imkânsız.
  const { data, error } = await supabase.rpc("get_next_fatura_sira");
  if (error || data === null || data === undefined) {
    throw new Error("Fatura sıra numarası alınamadı");
  }
  return `MBR-${yil}-${String(data)}`;
}

export function seansTypeLabel(sessionType: string): string {
  const etiketler: Record<string, string> = {
    bireysel: "Bireysel Seans",
    asenkron: "Asenkron Seans",
    grup: "Grup Seansı",
    cift_aile: "Çift / Aile Seansı",
    on_gorusme: "Ön Görüşme",
    supervizyon: "Süpervizyon Seansı",
  };
  return etiketler[sessionType] ?? sessionType;
}

export function formatTarih(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

export function formatTutar(tutar: number): string {
  return tutar.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " TL";
}
