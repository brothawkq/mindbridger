import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Validation ───────────────────────────────────────────────────────────────

const GecmisMesajSchema = z.object({
  rol: z.enum(["user", "assistant"]),
  icerik: z.string().max(2000),
});

const BodySchema = z.object({
  mesaj: z.string().min(1).max(1000),
  gecmis: z.array(GecmisMesajSchema).max(20).default([]),
  rol: z.enum(["musteri", "danisan"]),
});

// ─── Anthropic types ──────────────────────────────────────────────────────────

interface AnthropicContent {
  type: string;
  text?: string;
}

interface AnthropicApiResponse {
  content: AnthropicContent[];
  error?: { message: string };
}

// ─── Kriz kelimeleri ─────────────────────────────────────────────────────────

const KRIZ_KELIMELERI = [
  "intihar", "kendime zarar", "ölmek istiyorum", "yaşamak istemiyorum",
  "canıma kıyma", "hayatıma son", "kendimi öldür",
];

function krizKontrol(metin: string): boolean {
  const lower = metin.toLowerCase();
  return KRIZ_KELIMELERI.some((k) => lower.includes(k));
}

// ─── System Prompts ───────────────────────────────────────────────────────────

const MUSTERI_SYSTEM_PROMPT = `Sen MindBridger platformunun müşteri destek asistanısın. Giriş yapmış bir müşteriye yardımcı oluyorsun.

Platform Bilgileri:
- MindBridger, Türkiye'de psikolog ve PDR danışmanlarını bireysel müşterilerle buluşturan online terapi platformudur
- Müşteri panelinde şunlar yapılabilir: randevu alma, seans görüntüleme, ödeme geçmişi, günlük tutma, testler, ödevler, rozetler

Platform Navigasyonu (müşteri için):
- Randevu almak: /danismanlar sayfasından danışman seçin
- Mevcut randevular: /panelim/randevularim
- Ödeme geçmişi: /panelim/finans
- Günlük yazma: /panelim/gunluk
- Psikolojik testler: /panelim/testler
- Ödevler: /panelim/odevler
- Profil düzenleme: /panelim/profil

Randevu Kuralları:
- İptal 24 saat öncesine kadar yapılabilir (ücret iadesi alınır)
- No-show durumunda ücret iade edilmez
- İlk seans 15 dakika ücretsiz ön görüşmedir

Ödeme Bilgileri:
- Ödemeler güvenli iyzico altyapısı üzerinden yapılır
- İade süreci 3-5 iş günüdür
- Faturalar /panelim/finans sayfasında mevcuttur

Teknik Destek:
- Video seans için Chrome veya Firefox önerilir
- Bağlantı sorunu: sayfayı yenileyin, tarayıcı izinlerini kontrol edin
- Destek: destek@mindbridger.com

Kurallar:
- Her zaman Türkçe yanıt ver
- Yanıtları kısa tut (maksimum 3-4 cümle)
- Kullanıcı adı veya kişisel bilgileri system prompt'a dahil etme
- Kriz durumunda: 182 (ALO Psikiyatri) veya 112'ye yönlendir
- Tıbbi teşhis veya tedavi önerme`;

const DANISAN_SYSTEM_PROMPT = `Sen MindBridger platformunun danışman destek asistanısın. Giriş yapmış bir danışmana (psikolog/PDR) yardımcı oluyorsun.

Platform Bilgileri:
- MindBridger, Türkiye'de psikolog ve PDR danışmanlarını müşterilerle buluşturan online terapi platformudur
- Platform %20 komisyon alır; danışmanlar kendi fiyatlarını belirler

Danışman Paneli Navigasyonu:
- Takvim ve müsaitlik: /danisan/takvim
- Gelir ve ödemeler: /danisan/finans
- Danışanlarım: /danisan/danisanlar
- Randevular: /danisan/randevular
- Mesajlar: /danisan/mesajlar
- Profil düzenleme: /danisan/profil
- Blog yazıları: /danisan/blog
- Webinarlar: /danisan/webinar

Finansal Bilgiler:
- Ödeme her ayın 15'inde IBAN'a aktarılır
- Minimum ödeme eşiği: 500₺
- Kesinti: platform komisyonu %20
- IBAN güncelleme: /danisan/ayarlar

Takvim Yönetimi:
- Müsaitlik saatleri /danisan/takvim'den ayarlanır
- Randevu iptali 24 saat öncesine kadar yapılabilir
- Tekrarlayan müsaitlik bloğu eklenebilir

Profil ve Onay:
- Profil yayına alınmadan önce admin onayı gerekir
- Diploma ve kimlik belgesi yüklenmesi zorunludur
- Profil tamamlanma oranı /danisan/profil'de görülür

Kurallar:
- Her zaman Türkçe yanıt ver
- Yanıtları kısa tut (maksimum 3-4 cümle)
- Müşteri bilgilerini paylaşma (gizlilik)
- Teknik sorun için: destek@mindbridger.com`;

// ─── Rate limit ───────────────────────────────────────────────────────────────

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW = 60;

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

async function checkRateLimit(ip: string): Promise<boolean> {
  if (ip === "unknown") return true;
  const admin = createAdminClient();
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW * 1000).toISOString();

  const { data } = await admin
    .from("chatbot_rate_limits")
    .select("count, window_start")
    .eq("ip_address", ip)
    .maybeSingle();

  if (data && new Date(data.window_start) > new Date(windowStart)) {
    if (data.count >= RATE_LIMIT_MAX) return false;
    await admin
      .from("chatbot_rate_limits")
      .update({ count: data.count + 1, updated_at: new Date().toISOString() })
      .eq("ip_address", ip);
  } else {
    await admin.from("chatbot_rate_limits").upsert(
      {
        ip_address: ip,
        count: 1,
        window_start: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "ip_address" }
    );
  }
  return true;
}

// ─── POST /api/chatbot/panel-mesaj ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Giriş kontrolü
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  // Body parse
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const { mesaj, gecmis, rol } = parsed.data;

  // Kriz kontrolü
  if (krizKontrol(mesaj)) {
    return NextResponse.json({
      yanit: "Şu an zor bir dönemden geçiyor görünüyorsunuz. Lütfen hemen **182** (ALO Psikiyatri Hattı) veya **112**'yi arayın. Şu an yanınızdayız.",
    });
  }

  // Rate limit
  const ip = getIp(req);
  const allowed = await checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Çok fazla istek. Lütfen bir dakika bekleyin." },
      { status: 429 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Yapay zeka servisi şu an kullanılamıyor." },
      { status: 503 }
    );
  }

  const systemPrompt =
    rol === "musteri" ? MUSTERI_SYSTEM_PROMPT : DANISAN_SYSTEM_PROMPT;

  const messages = [
    ...gecmis.map((m) => ({ role: m.rol, content: m.icerik })),
    { role: "user" as const, content: mesaj },
  ];

  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 512,
        system: systemPrompt,
        messages,
      }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return NextResponse.json(
      { error: "Yapay zeka servisine bağlanılamadı." },
      { status: 502 }
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: "Yanıt alınamadı. Lütfen tekrar deneyin." },
      { status: 502 }
    );
  }

  const data = (await res.json()) as AnthropicApiResponse;
  if (data.error) {
    return NextResponse.json(
      { error: "Yapay zeka hatası oluştu." },
      { status: 502 }
    );
  }

  const yanit =
    data.content?.find((c) => c.type === "text")?.text ?? "Yanıt alınamadı.";

  return NextResponse.json({ yanit });
}
