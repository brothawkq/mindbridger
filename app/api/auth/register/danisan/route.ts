import "server-only"
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkIpStatus } from "@/lib/auth/bruteForce";
import { encrypt } from "@/lib/auth/encrypt";
import DanisanKayitOnayBekliyorMail from "@/lib/resend/templates/danisan-kayit-onay-bekleniyor";

// ─── Sabitler ────────────────────────────────────────────────────
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME   = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

// FIX #4: Cinsiyet enum — tip güvenliği + runtime doğrulama
const VALID_GENDERS  = ["erkek", "kadin", "belirtmek_istemiyorum"] as const;
type ValidGender     = typeof VALID_GENDERS[number];

// FIX #10: Dosya uzantısı çıkarıcı — Storage path'e eklenir
const MIME_EXT: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg":      ".jpg",
  "image/png":       ".png",
  "image/webp":      ".webp",
};

function getFileExtension(file: File): string {
  // 1. Dosya adından al
  const lastDot = file.name.lastIndexOf(".");
  if (lastDot !== -1) return file.name.slice(lastDot).toLowerCase();
  // 2. MIME tipinden fallback
  return MIME_EXT[file.type] ?? "";
}

// ─── Helper: IP ───────────────────────────────────────────────────
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

// ─── Helper: string → boolean ────────────────────────────────────
function parseBool(v: string | null): boolean {
  return v === "true" || v === "1";
}

// ─── Helper: string → number | null ─────────────────────────────
function parseNum(v: string | null): number | null {
  if (v === null || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

// ─── Helper: JSON string → string[] | null ───────────────────────
function parseJsonArray(v: string | null): string[] | null {
  if (!v) return null;
  try {
    const arr = JSON.parse(v) as unknown;
    if (Array.isArray(arr)) return arr.map(String);
    return null;
  } catch {
    return null;
  }
}

// ─── Helper: Supabase Storage'a dosya yükle ───────────────────────
async function uploadFile(
  supabase: ReturnType<typeof createAdminClient>,
  bucket: string,
  path: string,
  file: File
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });
  if (error) throw new Error(`Dosya yüklenemedi: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// ─── POST /api/auth/register/danisan ─────────────────────────────
export async function POST(req: NextRequest) {
  // 1. IP kontrol
  const ip = getClientIp(req);
  const ipStatus = await checkIpStatus(ip);
  if (ipStatus.blocked) {
    return NextResponse.json(
      { error: "Bu IP adresi geçici olarak engellenmiştir." },
      { status: 429 }
    );
  }

  // 2. FormData parse
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek formatı." }, { status: 400 });
  }

  // 3. Zorunlu string alanları
  const first_name = formData.get("first_name") as string | null;
  const last_name  = formData.get("last_name")  as string | null;
  const email      = formData.get("email")      as string | null;
  const password   = formData.get("password")   as string | null;
  const gender     = formData.get("gender")     as string | null;
  const city       = formData.get("city")       as string | null;
  const title      = formData.get("title")      as string | null;
  const bank_iban  = formData.get("bank_iban")  as string | null;
  const bank_name  = formData.get("bank_name")  as string | null;
  const bank_account_name = formData.get("bank_account_name") as string | null;

  // Temel alan kontrolü
  if (!first_name || !last_name || !email || !password || !gender || !city || !title) {
    return NextResponse.json({ error: "Zorunlu alanlar eksik." }, { status: 422 });
  }
  if (!bank_iban || !bank_name || !bank_account_name) {
    return NextResponse.json({ error: "Banka bilgileri zorunludur." }, { status: 422 });
  }

  // FIX #4: Cinsiyet enum doğrulama — sadece cast değil, runtime kontrolü
  if (!VALID_GENDERS.includes(gender as ValidGender)) {
    return NextResponse.json({ error: "Geçersiz cinsiyet değeri." }, { status: 422 });
  }

  // KVKK onayı zorunlu
  const kvkk = parseBool(formData.get("kvkk") as string | null);
  if (!kvkk) {
    return NextResponse.json({ error: "KVKK onayı zorunludur." }, { status: 422 });
  }

  // E-posta format kontrolü
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 422 });
  }

  // Şifre uzunluğu kontrolü
  if (password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: "Şifre 8-128 karakter arasında olmalıdır." }, { status: 422 });
  }

  // 4. Dosya kontrolleri
  const diplomaFile   = formData.get("diploma")     as File | null;
  const idDocumentFile = formData.get("id_document") as File | null;

  for (const [label, file] of [["diploma", diplomaFile], ["id_document", idDocumentFile]] as [string, File | null][]) {
    if (!file || file.size === 0) {
      return NextResponse.json({ error: `${label === "diploma" ? "Diploma" : "Kimlik belgesi"} yüklemek zorunludur.` }, { status: 422 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: `Dosya boyutu en fazla 10 MB olabilir (${label}).` }, { status: 422 });
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json({ error: `Desteklenmeyen dosya türü: ${file.type}` }, { status: 422 });
    }
  }

  // 5. JSON array alanlar
  const age_groups   = parseJsonArray(formData.get("age_groups")  as string | null);
  const languages    = parseJsonArray(formData.get("languages")   as string | null);
  const specialties  = parseJsonArray(formData.get("specialties") as string | null);
  const approach     = parseJsonArray(formData.get("approach")    as string | null);

  // 6. Sayısal / bool alanlar
  const session_duration      = parseNum(formData.get("session_duration")      as string | null) ?? 50;
  const price_individual      = parseNum(formData.get("price_individual")      as string | null);
  const is_online             = parseBool(formData.get("is_online")            as string | null);
  const is_in_person          = parseBool(formData.get("is_in_person")         as string | null);
  const intro_session_enabled = parseBool(formData.get("intro_session_enabled") as string | null);

  const supabase = createAdminClient();

  // 7. Supabase Auth kullanıcı oluştur
  const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: { first_name, last_name },
  });

  if (signUpError) {
    if (signUpError.message.toLowerCase().includes("already registered")) {
      return NextResponse.json(
        { error: "Bu e-posta adresiyle zaten bir hesap mevcut." },
        { status: 409 }
      );
    }
    console.error("[register/danisan] signUp error:", signUpError.message);
    return NextResponse.json({ error: "Kayıt sırasında bir hata oluştu." }, { status: 500 });
  }

  if (!authData.user) {
    return NextResponse.json({ error: "Kullanıcı oluşturulamadı." }, { status: 500 });
  }

  const userId = authData.user.id;

  // 8. Profiles tablosuna kayıt
  const kvkkIp = ip === "unknown" ? null : ip;
  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    first_name,
    last_name,
    role: "danisan",
    status: "pending",
    kvkk_accepted_at: new Date().toISOString(),
    kvkk_ip: kvkkIp,
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId);
    console.error("[register/danisan] profile insert error:", profileError.message);
    return NextResponse.json({ error: "Hesap oluşturulamadı." }, { status: 500 });
  }

  // 9. Dosyaları Storage'a yükle
  const timestamp = Date.now();
  let diplomaUrl: string;
  let idDocUrl: string;

  try {
    // FIX #10: Uzantı ekleniyor → Storage'da dosya türü belirli olur
    const diplomaExt = getFileExtension(diplomaFile!);
    const idDocExt   = getFileExtension(idDocumentFile!);

    diplomaUrl = await uploadFile(
      supabase,
      "danisan-belgeleri",
      `${userId}/diploma_${timestamp}${diplomaExt}`,
      diplomaFile!
    );
    idDocUrl = await uploadFile(
      supabase,
      "danisan-belgeleri",
      `${userId}/id_document_${timestamp}${idDocExt}`,
      idDocumentFile!
    );
  } catch (uploadErr) {
    // Dosya yükleme başarısız → kullanıcıyı ve profili temizle
    await supabase.from("profiles").delete().eq("id", userId);
    await supabase.auth.admin.deleteUser(userId);
    console.error("[register/danisan] file upload error:", uploadErr);
    return NextResponse.json({ error: "Belge yüklenirken hata oluştu. Lütfen tekrar deneyin." }, { status: 500 });
  }

  // 10. IBAN şifrele (AES-256-GCM)
  let encryptedIban: string;
  try {
    encryptedIban = encrypt(bank_iban);
  } catch (encErr) {
    await supabase.from("profiles").delete().eq("id", userId);
    await supabase.auth.admin.deleteUser(userId);
    console.error("[register/danisan] IBAN encrypt error:", encErr);
    return NextResponse.json({ error: "Banka bilgileri kaydedilemedi." }, { status: 500 });
  }

  // 11. Slug oluştur (first_name-last_name-userId ilk 8 karakter)
  const slugBase = `${first_name}-${last_name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const slug = `${slugBase}-${userId.slice(0, 8)}`;

  // 12. danisanlar tablosuna kayıt
  const { error: danisanError } = await supabase.from("danisanlar").insert({
    profile_id:           userId,
    slug,
    title,
    gender:               gender as "erkek" | "kadin" | "belirtmek_istemiyorum",
    city,
    age_groups:           age_groups ?? [],
    languages:            languages ?? ["Türkçe"],
    specialties:          specialties ?? [],
    approach:             approach ?? [],
    session_duration,
    price_individual,
    is_online,
    is_in_person,
    intro_session_enabled,
    diploma_url:          diplomaUrl,
    id_document_url:      idDocUrl,
    bank_iban:            encryptedIban,
    bank_name,
    bank_account_name,
    profile_published:    false,
  });

  if (danisanError) {
    // danisanlar kaydı başarısız → tamamen geri al
    await supabase.from("profiles").delete().eq("id", userId);
    await supabase.auth.admin.deleteUser(userId);
    console.error("[register/danisan] danisanlar insert error:", danisanError.message);
    return NextResponse.json({ error: "Profil oluşturulamadı." }, { status: 500 });
  }

  // 13. E-posta doğrulama linki gönder
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error: otpError } = await supabase.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: { redirectTo: `${appUrl}/e-posta-dogrulama` },
  });
  if (otpError) {
    console.error("[register/danisan] generateLink error:", otpError.message);
  }

  // 14. Bilgilendirme maili gönder (Resend) — hata kayıt sürecini engellemez
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "MindBridger <onboarding@resend.dev>",
      to: email,
      subject: "Danışman Başvurunuz Alındı — MindBridger",
      react: DanisanKayitOnayBekliyorMail({ isim: first_name }),
    });
  } catch (mailErr) {
    console.error("[register/danisan] resend mail error:", mailErr);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
