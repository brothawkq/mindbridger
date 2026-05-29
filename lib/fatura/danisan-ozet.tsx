import "server-only";
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { type SupabaseClient } from "@supabase/supabase-js";
import { formatTarih, formatTutar, seansTypeLabel } from "./numara";

interface OzetSatir {
  randevuId: string;
  seansLabel: string;
  seansZamani: string;
  brutTutar: number;
  komisyonTutar: number;
  netTutar: number;
}

interface OzetVerisi {
  danisanAdSoyad: string;
  donem: string;
  satirlar: OzetSatir[];
  toplamBrut: number;
  toplamKomisyon: number;
  toplamNet: number;
}

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: "#212121", backgroundColor: "#FFFFFF", padding: 48 },
  header: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 2, borderBottomColor: "#212121", paddingBottom: 14, marginBottom: 28 },
  brand: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  brandSub: { fontSize: 9, color: "#757575", marginTop: 2 },
  title: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, color: "#424242", marginTop: 4 },
  sectionLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 1, textTransform: "uppercase", color: "#757575", marginBottom: 8 },
  tableHeader: { flexDirection: "row", backgroundColor: "#F5F5F5", borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#E0E0E0", paddingVertical: 6, paddingHorizontal: 8 },
  thCell: { fontSize: 8, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5, color: "#424242" },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#E0E0E0", paddingVertical: 7, paddingHorizontal: 8 },
  tdCell: { fontSize: 9 },
  colLabel: { flex: 2 },
  colTarih: { flex: 2 },
  colBrut: { flex: 1.5, alignItems: "flex-end" },
  colKomisyon: { flex: 1.5, alignItems: "flex-end" },
  colNet: { flex: 1.5, alignItems: "flex-end" },
  totalBox: { marginTop: 20, alignItems: "flex-end" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", width: 260, marginBottom: 4 },
  totalLabel: { fontSize: 10, color: "#424242" },
  totalValue: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  grandRow: { flexDirection: "row", justifyContent: "space-between", width: 260, borderTopWidth: 1.5, borderTopColor: "#212121", paddingTop: 6, marginTop: 4 },
  grandLabel: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  grandValue: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  note: { fontSize: 8, color: "#9E9E9E", borderTopWidth: 0.5, borderTopColor: "#E0E0E0", paddingTop: 12, marginTop: 32, lineHeight: 1.6 },
});

function DanisanOzetTemplate({ veri }: { veri: OzetVerisi }) {
  return (
    <Document title={`Kazanç Özeti — ${veri.donem}`} author="MindBridger" creator="MindBridger">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.brand}>MindBridger</Text>
            <Text style={s.brandSub}>Online Terapi Platformu</Text>
          </View>
          <View>
            <Text style={s.title}>KAZANÇ ÖZETİ</Text>
            <Text style={s.subtitle}>{veri.danisanAdSoyad}</Text>
            <Text style={s.subtitle}>{veri.donem}</Text>
          </View>
        </View>

        <Text style={s.sectionLabel}>Seans Detayları</Text>

        <View>
          <View style={s.tableHeader}>
            <View style={s.colLabel}><Text style={s.thCell}>Hizmet</Text></View>
            <View style={s.colTarih}><Text style={s.thCell}>Tarih</Text></View>
            <View style={s.colBrut}><Text style={s.thCell}>Brüt</Text></View>
            <View style={s.colKomisyon}><Text style={s.thCell}>Komisyon</Text></View>
            <View style={s.colNet}><Text style={s.thCell}>Net</Text></View>
          </View>
          {veri.satirlar.map((satir) => (
            <View key={satir.randevuId} style={s.tableRow}>
              <View style={s.colLabel}><Text style={s.tdCell}>{satir.seansLabel}</Text></View>
              <View style={s.colTarih}><Text style={s.tdCell}>{formatTarih(satir.seansZamani)}</Text></View>
              <View style={s.colBrut}><Text style={s.tdCell}>{formatTutar(satir.brutTutar)}</Text></View>
              <View style={s.colKomisyon}><Text style={s.tdCell}>{formatTutar(satir.komisyonTutar)}</Text></View>
              <View style={s.colNet}><Text style={s.tdCell}>{formatTutar(satir.netTutar)}</Text></View>
            </View>
          ))}
        </View>

        <View style={s.totalBox}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Toplam Brüt</Text>
            <Text style={s.totalValue}>{formatTutar(veri.toplamBrut)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Platform Komisyonu</Text>
            <Text style={s.totalValue}>- {formatTutar(veri.toplamKomisyon)}</Text>
          </View>
          <View style={s.grandRow}>
            <Text style={s.grandLabel}>NET KAZANÇ</Text>
            <Text style={s.grandValue}>{formatTutar(veri.toplamNet)}</Text>
          </View>
        </View>

        <Text style={s.note}>
          Bu özet MindBridger platformu tarafından otomatik olarak oluşturulmuştur.
          {"\n"}
          Soru ve talepleriniz için: platform@mindbridger.com
        </Text>
      </Page>
    </Document>
  );
}

export async function danisanOzetOlustur(
  danisanId: string,
  yil: number,
  ay: number,
  supabase: SupabaseClient,
): Promise<{ pdfUrl: string } | null> {
  const donemBaslangic = new Date(yil, ay - 1, 1).toISOString();
  const donemBitis = new Date(yil, ay, 0, 23, 59, 59).toISOString();

  const { data: odemeler } = await supabase
    .from("payments")
    .select("id, randevu_id, amount_gross, commission_amount, amount_net")
    .eq("danisan_id", danisanId)
    .eq("status", "captured")
    .gte("paid_at", donemBaslangic)
    .lte("paid_at", donemBitis)
    .is("deleted_at", null);

  if (!odemeler || odemeler.length === 0) return null;

  const randevuIdleri = odemeler.map((o) => o.randevu_id);

  const { data: randevular } = await supabase
    .from("randevular")
    .select("id, session_type, scheduled_at")
    .in("id", randevuIdleri);

  const randevuMap = new Map((randevular ?? []).map((r) => [r.id, r]));

  const { data: danisan } = await supabase
    .from("danisanlar")
    .select("profile_id")
    .eq("id", danisanId)
    .single();

  const { data: profil } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", danisan?.profile_id ?? "")
    .single();

  const satirlar: OzetSatir[] = odemeler.map((o) => {
    const r = randevuMap.get(o.randevu_id);
    return {
      randevuId: o.randevu_id,
      seansLabel: r ? seansTypeLabel(r.session_type) : "Seans",
      seansZamani: r?.scheduled_at ?? donemBaslangic,
      brutTutar: o.amount_gross,
      komisyonTutar: o.commission_amount,
      netTutar: o.amount_net,
    };
  });

  const toplamBrut = satirlar.reduce((t, s) => t + s.brutTutar, 0);
  const toplamKomisyon = satirlar.reduce((t, s) => t + s.komisyonTutar, 0);
  const toplamNet = satirlar.reduce((t, s) => t + s.netTutar, 0);

  const ayAdi = new Date(yil, ay - 1).toLocaleString("tr-TR", { month: "long", year: "numeric" });

  const veri: OzetVerisi = {
    danisanAdSoyad: `${profil?.first_name ?? ""} ${profil?.last_name ?? ""}`.trim(),
    donem: ayAdi,
    satirlar,
    toplamBrut: Math.round(toplamBrut * 100) / 100,
    toplamKomisyon: Math.round(toplamKomisyon * 100) / 100,
    toplamNet: Math.round(toplamNet * 100) / 100,
  };

  const pdfBuffer = await renderToBuffer(<DanisanOzetTemplate veri={veri} />);

  const dosyaYolu = `ozet/${danisanId}/${yil}-${String(ay).padStart(2, "0")}.pdf`;

  await supabase.storage
    .from("faturalar")
    .upload(dosyaYolu, pdfBuffer, { contentType: "application/pdf", upsert: true });

  const { data: urlData } = supabase.storage.from("faturalar").getPublicUrl(dosyaYolu);

  return { pdfUrl: urlData.publicUrl };
}
