import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { formatTarih, formatTutar } from "./numara";

export interface FaturaVerisi {
  faturaNumarasi: string;
  faturaTarihi: string;
  musteriAdSoyad: string;
  musteriEmail: string;
  danisanAdSoyad: string;
  danisanUnvan: string;
  seansLabel: string;
  seansZamani: string;
  seansSuresi: number;
  brutTutar: number;
}

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#212121",
    backgroundColor: "#FFFFFF",
    padding: 48,
  },
  // Header
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
  // Parties
  parties: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  partyBox: { width: "45%" },
  partyLabel: {
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
  partyLine: { fontSize: 10, marginBottom: 3 },
  partyMuted: { fontSize: 9, color: "#757575" },
  // Table
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
  colHizmet: { flex: 3 },
  colTarih: { flex: 2 },
  colSure: { flex: 1 },
  colTutar: { flex: 2, alignItems: "flex-end" },
  cellText: { fontSize: 10 },
  // Total
  totalSection: { alignItems: "flex-end", marginBottom: 40 },
  totalBox: {
    width: 220,
    borderTopWidth: 1.5,
    borderTopColor: "#212121",
    paddingTop: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  totalLabel: { fontSize: 10, color: "#424242" },
  totalAmount: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  // Note
  note: {
    fontSize: 8,
    color: "#9E9E9E",
    borderTopWidth: 0.5,
    borderTopColor: "#E0E0E0",
    paddingTop: 12,
    lineHeight: 1.6,
  },
  // Footer
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
});

export function FaturaTemplate({ veri }: { veri: FaturaVerisi }) {
  return (
    <Document
      title={`Fatura ${veri.faturaNumarasi}`}
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
            <Text style={s.invoiceTitle}>FATURA</Text>
            <Text style={s.metaRow}>No: {veri.faturaNumarasi}</Text>
            <Text style={s.metaRow}>Tarih: {formatTarih(veri.faturaTarihi)}</Text>
          </View>
        </View>

        {/* Parties */}
        <View style={s.parties}>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>Faturalanan</Text>
            <Text style={s.partyLine}>{veri.musteriAdSoyad}</Text>
            <Text style={s.partyMuted}>{veri.musteriEmail}</Text>
          </View>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>Hizmet Veren</Text>
            <Text style={s.partyLine}>{veri.danisanAdSoyad}</Text>
            <Text style={s.partyMuted}>{veri.danisanUnvan}</Text>
            <Text style={[s.partyMuted, { marginTop: 4 }]}>MindBridger platformu aracılığıyla</Text>
          </View>
        </View>

        {/* Service Table */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <View style={s.colHizmet}><Text style={s.tableHeaderCell}>Hizmet</Text></View>
            <View style={s.colTarih}><Text style={s.tableHeaderCell}>Seans Tarihi</Text></View>
            <View style={s.colSure}><Text style={s.tableHeaderCell}>Süre</Text></View>
            <View style={s.colTutar}><Text style={s.tableHeaderCell}>Tutar</Text></View>
          </View>
          <View style={s.tableRow}>
            <View style={s.colHizmet}><Text style={s.cellText}>{veri.seansLabel}</Text></View>
            <View style={s.colTarih}><Text style={s.cellText}>{formatTarih(veri.seansZamani)}</Text></View>
            <View style={s.colSure}><Text style={s.cellText}>{veri.seansSuresi} dk</Text></View>
            <View style={s.colTutar}><Text style={s.cellText}>{formatTutar(veri.brutTutar)}</Text></View>
          </View>
        </View>

        {/* Total */}
        <View style={s.totalSection}>
          <View style={s.totalBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Toplam Tutar</Text>
              <Text style={s.totalAmount}>{formatTutar(veri.brutTutar)}</Text>
            </View>
          </View>
        </View>

        {/* Note */}
        <Text style={s.note}>
          Bu fatura MindBridger Online Terapi Platformu (mindbridger.com) tarafından elektronik ortamda düzenlenmiştir.
          {"\n"}
          Seans hizmeti {veri.danisanAdSoyad} tarafından, platform aracılığıyla sağlanmıştır.
          {"\n"}
          Soru ve talepleriniz için: platform@mindbridger.com
        </Text>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>MindBridger · mindbridger.com</Text>
          <Text style={s.footerText}>{veri.faturaNumarasi}</Text>
        </View>
      </Page>
    </Document>
  );
}
