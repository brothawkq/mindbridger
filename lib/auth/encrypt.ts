/**
 * AES-256-GCM Şifreleme / Çözme Yardımcısı — SADECE SUNUCU TARAFI
 *
 * Kullanım alanları:
 *  - Banka IBAN numaraları (danisanlar.bank_iban)
 *  - Google / Outlook OAuth token'ları (takvim_sync tablosu)
 *
 * Algoritma: AES-256-GCM (kimlik doğrulamalı şifreleme)
 *  - 256-bit anahtar (ENCRYPTION_KEY env)
 *  - 96-bit rastgele IV (her şifreleme için yeni)
 *  - 128-bit GCM auth tag (veri bütünlüğü + doğrulama)
 *
 * Çıktı formatı: <iv_hex>:<authTag_hex>:<ciphertext_hex>
 *
 * ⚠️  Şifrelenmiş veya çözülmüş değerleri asla loglama.
 */
import "server-only"; // [FIX #5] Client bundle'a girmesini derleme zamanında engelle
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM  = "aes-256-gcm";
const IV_LENGTH  = 12;   // GCM için önerilen: 96 bit
const TAG_LENGTH = 16;   // GCM auth tag: 128 bit
const HEX_REGEX  = /^[0-9a-f]+$/i; // [FIX #16] isEncrypted hex doğrulaması için

function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;

  if (!keyHex) {
    throw new Error("ENCRYPTION_KEY ortam değişkeni tanımlı değil.");
  }

  const key = Buffer.from(keyHex, "hex");

  if (key.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY 32 byte (64 hex karakter) olmalıdır. " +
        "`openssl rand -hex 32` ile üretin."
    );
  }

  return key;
}

/**
 * Düz metni AES-256-GCM ile şifreler.
 *
 * @param plaintext  Şifrelenecek metin (örn. IBAN, OAuth token)
 * @returns          "<iv>:<authTag>:<ciphertext>" formatında hex string
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

/**
 * `encrypt()` ile şifrelenmiş veriyi çözer.
 *
 * @param ciphertext  "<iv>:<authTag>:<ciphertext>" formatında hex string
 * @returns           Orijinal düz metin
 * @throws            Veri bozuksa veya anahtar yanlışsa hata fırlatır
 */
export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const parts = ciphertext.split(":");

  if (parts.length !== 3) {
    throw new Error("Geçersiz şifreli veri formatı.");
  }

  const [ivHex, authTagHex, encryptedHex] = parts as [string, string, string];

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encryptedData = Buffer.from(encryptedHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    throw new Error("Şifre çözme başarısız: veri bozuk veya anahtar hatalı.");
  }
}

/**
 * Verinin `encrypt()` ile şifrelenip şifrelenmediğini kontrol eder.
 * Veritabanındaki alanların şifrelenmiş olup olmadığını doğrulamak için kullanılır.
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(":");
  if (parts.length !== 3) return false;

  const [ivHex, authTagHex, encryptedHex] = parts as [string, string, string];

  // [FIX #16] Uzunluk kontrolüne ek olarak hex karakter geçerliliği doğrulandı
  return (
    ivHex.length === IV_LENGTH * 2       && HEX_REGEX.test(ivHex) &&
    authTagHex.length === TAG_LENGTH * 2 && HEX_REGEX.test(authTagHex) &&
    encryptedHex.length > 0              && HEX_REGEX.test(encryptedHex)
  );
}
