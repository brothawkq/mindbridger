import "server-only"
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Validation ───────────────────────────────────────────────────
// FIX #2: type alanı eklendi — sayfa artık { token, type } gönderiyor.
// Geçerli değerler: "email" (kayıt doğrulama) | "signup" | "email_change"
const schema = z.object({
  token: z.string({ message: "Token zorunludur." }).min(6).max(2048),
  type:  z
    .enum(["email", "signup", "email_change"])
    .optional()
    .default("email"),
});

// ─── POST /api/auth/verify-email ─────────────────────────────────
//
// Supabase, e-posta doğrulama için iki farklı akış destekler:
//  a) Email link → Supabase, kullanıcıyı callback URL'ye yönlendirir;
//     oturum otomatik açılır. Bu durumda route'a istek gelmez.
//  b) OTP (6 haneli kod) → Kullanıcı formu girer; bu route işler.
//
// MindBridger'da Supabase'in default e-posta link yönlendirmesini
// `/e-posta-dogrulama` sayfasına yönlendiriyoruz ve burada
// URL'deki `token_hash` + `type` parametrelerini işliyoruz.
// Bu route, token_hash tabanlı OTP doğrulama için kullanılır.
// ─────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Body parse
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek formatı." }, { status: 400 });
  }

  // 2. Validation
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz token." }, { status: 400 });
  }

  const { token, type } = parsed.data;
  const supabase = createAdminClient();

  // 3. Token ile OTP doğrulama — type sayfadan iletiliyor
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: type as "email" | "signup" | "email_change",
  });

  if (error) {
    // Token süresi dolmuş veya geçersiz
    if (
      error.message.toLowerCase().includes("expired") ||
      error.message.toLowerCase().includes("invalid") ||
      error.message.toLowerCase().includes("not found")
    ) {
      return NextResponse.json(
        { error: "Doğrulama bağlantısının süresi dolmuş veya geçersiz." },
        { status: 410 }
      );
    }

    // Zaten doğrulanmış
    if (error.message.toLowerCase().includes("already confirmed")) {
      return NextResponse.json({ already_verified: true }, { status: 200 });
    }

    console.error("[verify-email] verifyOtp error:", error.message);
    return NextResponse.json({ error: "Doğrulama sırasında bir hata oluştu." }, { status: 500 });
  }

  const userId = data.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  // 4. Profil durumunu pending → active yap (musteri için; danisan/kurumsal pending kalır)
  const { data: profile, error: profileFetchError } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", userId)
    .single();

  if (profileFetchError || !profile) {
    console.error("[verify-email] profile fetch error:", profileFetchError?.message);
    return NextResponse.json({ error: "Profil bulunamadı." }, { status: 500 });
  }

  const role = profile.role;
  const newStatus = role === "musteri" ? "active" : "pending";
  // Danışman ve kurumsal hesaplar admin onayı beklediğinden pending kalır

  if (profile.status === "pending") {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", userId);

    if (updateError) {
      console.error("[verify-email] profile update error:", updateError.message);
      // Güncelleme hatası kritik değil — yanıtı durdurmuyoruz
    }
  }

  return NextResponse.json({ ok: true, role }, { status: 200 });
}
