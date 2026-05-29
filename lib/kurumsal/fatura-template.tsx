import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"
import { formatTutar } from "@/lib/fatura/numara"

export interface KurumsalFaturaVerisi {
  faturaNumarasi: string
  faturaTarihi: string
  sirketAdi: string
  sirketEmail: string
  sirketYetkilisi: string
  donemBaslangic: string
  donemBitis: string
  toplamSeans: number
  tamamlananSeans: number
  iptalSeans: number
  toplamTutar: number
  aktifCalisanSayisi: number
}

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#212121",
    backgroundColor: "#FFFFFF",
    padding: 48,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    borderBottomWidth: 2,
    borderBottomColor: "#212121",
    paddingBottom: 16,
  },
  brand: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  brandSub: { fontSize: 9, color: "#757575", marginTop: 2 },
  invoiceMeta: { alignItems: "flex-end" },
  invoiceTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  metaRow: { fontSize: 9, color: "#424242", marginBottom: 2 },
  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#757575",
    marginBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E0E0E0",
    paddingBottom: 4,
  },
  infoRow: { flexDirection: "row", marginBottom: 4 },
  infoKey: { fontSize: 9, color: "#757575", width: 120 },
  infoVal: { fontSize: 10, flex: 1 },
  table: { marginBottom: 28 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E0E0E0",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#424242",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E0E0E0",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  colKalem: { flex: 3 },
  colDeger: { flex: 2, alignItems: "flex-end" },
  cellText: { fontSize: 10 },
  totalSection: { alignItems: "flex-end", marginBottom: 40 },
  totalBox: {
    width: 220,
    borderTopWidth: 1.5,
    borderTopColor: "#212121",
    paddingTop: 8,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  totalLabel: { fontSize: 10, color: "#424242" },
  totalAmount: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  note: {
    fontSize: 8,
    color: "#9E9E9E",
    borderTopWidth: 0.5,
    borderTopColor: "#E0E0E0",
    paddingTop: 12,
    lineHeight: 1.6,
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#E0E0E0",
    paddingTop: 8,
  },
  footerText: { fontSize: 8, color: "#9E9E9E" },
})

export function KurumsalFaturaTemplate({ veri }: { veri: KurumsalFaturaVerisi }) {
  return (
    <Document
      title={`Kurumsal Fatura ${veri.faturaNumarasi}`}
      author="MindBridger"
      creator="MindBridger"
    >
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.brand}>MindBridger</Text>
            <Text style={s.brandSub}>Online Terapi Platformu</Text>
            <Text style={s.brandSub}>platform@mindbridger.com</Text>
          </View>
          <View style={s.invoiceMeta}>
            <Text style={s.invoiceTitle}>KURUMSAL FATURA</Text>
            <Text style={s.metaRow}>No: {veri.faturaNumarasi}</Text>
            <Text style={s.metaRow}>Tarih: {veri.faturaTarihi}</Text>
            <Text style={s.metaRow}>
              Dönem: {veri.donemBaslangic} – {veri.donemBitis}
            </Text>
          </View>
        </View>

        {/* Company Info */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Faturalanan Kurum</Text>
          <View style={s.infoRow}>
            <Text style={s.infoKey}>Şirket Adı</Text>
            <Text style={s.infoVal}>{veri.sirketAdi}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoKey}>Yetkili</Text>
            <Text style={s.infoVal}>{veri.sirketYetkilisi}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoKey}>E-posta</Text>
            <Text style={s.infoVal}>{veri.sirketEmail}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoKey}>Aktif Çalışan</Text>
            <Text style={s.infoVal}>{veri.aktifCalisanSayisi} kişi</Text>
          </View>
        </View>

        {/* Session Summary */}
        <View style={s.table}>
          <Text style={s.sectionLabel}>Dönem Seans Özeti</Text>
          <View style={s.tableHeader}>
            <View style={s.colKalem}>
              <Text style={s.tableHeaderCell}>Kalem</Text>
            </View>
            <View style={s.colDeger}>
              <Text style={s.tableHeaderCell}>Değer</Text>
            </View>
          </View>
          <View style={s.tableRow}>
            <View style={s.colKalem}><Text style={s.cellText}>Toplam Seans Sayısı</Text></View>
            <View style={s.colDeger}><Text style={s.cellText}>{String(veri.toplamSeans)}</Text></View>
          </View>
          <View style={s.tableRow}>
            <View style={s.colKalem}><Text style={s.cellText}>Tamamlanan Seans</Text></View>
            <View style={s.colDeger}><Text style={s.cellText}>{String(veri.tamamlananSeans)}</Text></View>
          </View>
          <View style={s.tableRow}>
            <View style={s.colKalem}><Text style={s.cellText}>İptal / No-show</Text></View>
            <View style={s.colDeger}><Text style={s.cellText}>{String(veri.iptalSeans)}</Text></View>
          </View>
        </View>

        {/* Total */}
        <View style={s.totalSection}>
          <View style={s.totalBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Dönem Toplam Tutarı</Text>
              <Text style={s.totalAmount}>{formatTutar(veri.toplamTutar)}</Text>
            </View>
          </View>
        </View>

        {/* Note */}
        <Text style={s.note}>
          Bu fatura MindBridger Online Terapi Platformu (mindbridger.com) tarafından elektronik ortamda
          düzenlenmiştir.{"\n"}
          Çalışan kişisel verileri KVKK kapsamında bu belgede yer almamaktadır.{"\n"}
          Soru ve talepleriniz için: platform@mindbridger.com
        </Text>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>MindBridger · mindbridger.com</Text>
          <Text style={s.footerText}>{veri.faturaNumarasi}</Text>
        </View>
      </Page>
    </Document>
  )
}
