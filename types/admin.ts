export interface PayoutSatir {
  id: string;
  danisanAdi: string;
  danisanUnvan: string | null;
  bankAdi: string | null;
  seansAdet: number;
  brut: number;
  komisyon: number;
  net: number;
  durum: "pending" | "processing" | "completed" | "failed";
  odenmeTarihi: string | null;
}

export interface IslemSatir {
  id: string;
  tarih: string;
  musteriAdi: string;
  danisanAdi: string;
  brut: number;
  komisyon: number;
  net: number;
  durum: string;
}

export interface IadeSatir {
  id: string;
  tarih: string;
  miktar: number;
  iadePct: number;
  sebep: string;
  durum: string;
}

export interface FinansSummary {
  toplamBrut: number;
  toplamKomisyon: number;
  toplamNet: number;
  seansAdet: number;
  bekleyenDanisanSayisi: number;
  bekleyenTutar: number;
  isleniyorTutar: number;
  odendiTutar: number;
}

export interface AdminFinansResponse {
  summary: FinansSummary;
  payoutlar: PayoutSatir[];
  islemler: IslemSatir[];
  iadeler: IadeSatir[];
  toplam: number;
  sayfa: number;
  toplamSayfa: number;
}

export interface FaturaSatir {
  id: string;
  faturaNu: string;
  tarih: string;
  tip: "bireysel" | "kurumsal_aylik";
  musteriAdi: string;
  danisanAdi: string;
  tutar: number;
  pdfUrl: string | null;
}

export interface FaturaListeResponse {
  faturalar: FaturaSatir[];
  toplam: number;
  sayfa: number;
  toplamSayfa: number;
}

export interface AdminRandevuOzet {
  id: string;
  scheduledAt: string;
  sessionType: string;
  status: string;
  price: number | null;
  durationMinutes: number | null;
  musteriAdi: string;
  musteriId: string;
  danisanAdi: string;
  danisanId: string;
  cancellationReason: string | null;
  noShowCharged: boolean;
}

export interface AdminRandevuListeResponse {
  randevular: AdminRandevuOzet[];
  toplam: number;
  sayfa: number;
  toplamSayfa: number;
}

export interface BasvuruOzet {
  profilId: string;
  danisanId: string;
  adSoyad: string;
  uzmanlik: string[];
  sehir: string | null;
  basvuruTarihi: string;
  durum: "pending" | "active" | "rejected" | "suspended";
  diplomaUrl: string | null;
  idDocumentUrl: string | null;
  profilTamamlanma: number;
  redGerekce: string | null;
}

export interface BasvuruListeResponse {
  basvurular: BasvuruOzet[];
  toplam: number;
  sayfa: number;
  toplamSayfa: number;
}

export interface KullaniciOzet {
  id: string;
  adSoyad: string;
  rol: string;
  durum: string;
  kayitTarihi: string;
  sonGiris: string | null;
  churnSkoru: number;
}

export interface KullaniciListeResponse {
  kullanicilar: KullaniciOzet[];
  toplam: number;
  sayfa: number;
  toplamSayfa: number;
}

export interface IstatistikVeri {
  kpi: {
    bugunRandevular: number;
    bugunDegisim: number;
    bekleyenOnaylar: number;
    haftaGeliri: number;
    haftaGeliriHedef: number;
    haftaKomisyon: number;
    bekleyenTransferTutar: number;
    bekleyenTransferDanisanSayisi: number;
  };
  seansGrafik: Array<{
    tarih: string;
    adet: number;
    haftaSonu: boolean;
  }>;
  bekleyenBasvurular: Array<{
    id: string;
    adSoyad: string;
    uzmanlik: string;
    basvuruTarihi: string;
    durum: "Yeni" | "İncelemede";
  }>;
  bekleyenBloglar: Array<{
    id: string;
    baslik: string;
    danisanAdi: string;
    gonderiTarihi: string;
    durum: "İncelemede" | "Taslak" | "Yeni";
  }>;
  guncellemeTarihi: string;
}

export interface BlogSatir {
  id: string;
  baslik: string;
  slug: string;
  durum: "draft" | "pending" | "published" | "rejected";
  danisanAdi: string;
  yayinTarihi: string | null;
  goruntuleme: number;
  redGerekce: string | null;
}

export interface TestSatir {
  id: string;
  baslik: string;
  slug: string;
  aciklama: string;
  aktif: boolean;
  sureme: number | null;
}

export interface KaynaklarSatir {
  id: string;
  baslik: string;
  tip: "pdf" | "video" | "link";
  kategori: string[];
  aktif: boolean;
}

export interface SssSatir {
  id: string;
  soru: string;
  cevap: string;
  kategori: string;
  sira: number;
  aktif: boolean;
}

export interface WebinarSatir {
  id: string;
  baslik: string;
  sunucu: string;
  tarih: string;
  sure: number | null;
  fiyat: number;
  kapasite: number;
  kayitli: number;
  durum: "draft" | "published" | "cancelled" | "completed";
}

export interface AdminIcerikResponse {
  blog: BlogSatir[];
  testler: TestSatir[];
  kaynaklar: KaynaklarSatir[];
  sss: SssSatir[];
  webinarlar: WebinarSatir[];
  toplam: number;
  sayfa: number;
  toplamSayfa: number;
}
