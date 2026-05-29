"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  ad:    z.string().min(2, "En az 2 karakter").max(100),
  email: z.string().email("Geçerli bir e-posta girin"),
  mesaj: z.string().min(10, "En az 10 karakter").max(2000),
});

type FormData = z.infer<typeof schema>;

type GonderimDurumu = "bos" | "yukleniyor" | "basarili" | "hata";

export default function IletisimFormuKlient() {
  const [durum, setDurum] = useState<GonderimDurumu>("bos");
  const [hataMetni, setHataMetni] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setDurum("yukleniyor");
    setHataMetni("");

    try {
      const res = await fetch("/api/iletisim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.status === 429) {
        setHataMetni("Çok fazla istek gönderildi. Lütfen bir süre bekleyin.");
        setDurum("hata");
        return;
      }

      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setHataMetni(json.error ?? "Gönderim sırasında bir hata oluştu.");
        setDurum("hata");
        return;
      }

      setDurum("basarili");
      reset();
    } catch {
      setHataMetni("Sunucuya ulaşılamadı. Lütfen tekrar deneyin.");
      setDurum("hata");
    }
  }

  if (durum === "basarili") {
    return (
      <div
        style={{
          border: "1.5px solid #325343",
          padding: "32px 24px",
          backgroundColor: "var(--mb-surface)",
          maxWidth: 560,
        }}
      >
        <p style={{ fontSize: 16, fontWeight: 700, color: "var(--mb-text)", marginBottom: 8 }}>
          Mesajınız İletildi ✓
        </p>
        <p style={{ fontSize: 13, color: "var(--mb-muted)", lineHeight: 1.6, margin: 0 }}>
          En kısa sürede size geri döneceğiz. Ortalama yanıt süresi 1 iş günüdür.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 560 }}
    >
      {/* Ad */}
      <div>
        <label
          htmlFor="iletisim-ad"
          style={{
            display: "block",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.8px",
            textTransform: "uppercase",
            color: "var(--mb-muted)",
            marginBottom: 6,
          }}
        >
          Ad Soyad
        </label>
        <input
          id="iletisim-ad"
          type="text"
          autoComplete="name"
          aria-invalid={!!errors.ad}
          aria-describedby={errors.ad ? "iletisim-ad-hata" : undefined}
          {...register("ad")}
          placeholder="Adınız Soyadınız"
          style={{
            width: "100%",
            boxSizing: "border-box",
            border: "1.5px solid #325343",
            padding: "9px 12px",
            fontSize: 13,
            fontFamily: "inherit",
            backgroundColor: errors.ad ? "var(--mb-bg)" : "var(--mb-surface)",
            color: "var(--mb-text)",
            outline: "none",
          }}
        />
        {errors.ad && (
          <p id="iletisim-ad-hata" role="alert" style={{ fontSize: 11, color: "#d32f2f", marginTop: 4 }}>
            ⚠ {errors.ad.message}
          </p>
        )}
      </div>

      {/* E-posta */}
      <div>
        <label
          htmlFor="iletisim-email"
          style={{
            display: "block",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.8px",
            textTransform: "uppercase",
            color: "var(--mb-muted)",
            marginBottom: 6,
          }}
        >
          E-posta
        </label>
        <input
          id="iletisim-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "iletisim-email-hata" : undefined}
          {...register("email")}
          placeholder="ornek@email.com"
          style={{
            width: "100%",
            boxSizing: "border-box",
            border: "1.5px solid #325343",
            padding: "9px 12px",
            fontSize: 13,
            fontFamily: "inherit",
            backgroundColor: errors.email ? "var(--mb-bg)" : "var(--mb-surface)",
            color: "var(--mb-text)",
            outline: "none",
          }}
        />
        {errors.email && (
          <p id="iletisim-email-hata" role="alert" style={{ fontSize: 11, color: "#d32f2f", marginTop: 4 }}>
            ⚠ {errors.email.message}
          </p>
        )}
      </div>

      {/* Mesaj */}
      <div>
        <label
          htmlFor="iletisim-mesaj"
          style={{
            display: "block",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.8px",
            textTransform: "uppercase",
            color: "var(--mb-muted)",
            marginBottom: 6,
          }}
        >
          Mesajınız
        </label>
        <textarea
          id="iletisim-mesaj"
          rows={5}
          aria-invalid={!!errors.mesaj}
          aria-describedby={errors.mesaj ? "iletisim-mesaj-hata" : undefined}
          {...register("mesaj")}
          placeholder="Nasıl yardımcı olabiliriz?"
          style={{
            width: "100%",
            boxSizing: "border-box",
            border: "1.5px solid #325343",
            padding: "9px 12px",
            fontSize: 13,
            fontFamily: "inherit",
            backgroundColor: errors.mesaj ? "var(--mb-bg)" : "var(--mb-surface)",
            color: "var(--mb-text)",
            outline: "none",
            resize: "vertical",
          }}
        />
        {errors.mesaj && (
          <p id="iletisim-mesaj-hata" role="alert" style={{ fontSize: 11, color: "#d32f2f", marginTop: 4 }}>
            ⚠ {errors.mesaj.message}
          </p>
        )}
      </div>

      {/* Sunucu hatası */}
      {durum === "hata" && hataMetni && (
        <p role="alert" style={{ fontSize: 12, color: "#d32f2f", padding: "8px 12px", border: "1.5px solid #d32f2f" }}>
          ⚠ {hataMetni}
        </p>
      )}

      <button
        type="submit"
        disabled={durum === "yukleniyor"}
        style={{
          alignSelf: "flex-start",
          padding: "11px 28px",
          backgroundColor: durum === "yukleniyor" ? "var(--mb-muted)" : "var(--mb-primary)",
          color: "var(--mb-primary-text)",
          border: "none",
          fontSize: 13,
          fontWeight: 700,
          fontFamily: "inherit",
          cursor: durum === "yukleniyor" ? "default" : "pointer",
        }}
      >
        {durum === "yukleniyor" ? "Gönderiliyor…" : "Gönder"}
      </button>
    </form>
  );
}
