"use client";

import { useEffect, useRef, useState } from "react";

/**
 * useTypewriter — Metin dizisini sırayla daktilo efektiyle yazar.
 * Son metne ulaştığında başa döner (sonsuz döngü).
 * prefers-reduced-motion aktifse ilk metni anında döner.
 *
 * @param texts       - Sırayla gösterilecek metin dizisi
 * @param typingSpeed - Karakter başına yazma hızı (ms), varsayılan 60
 * @param pauseMs     - Metin tamamlandıktan sonra bekleme süresi (ms), varsayılan 1800
 */
export function useTypewriter(
  texts: string[],
  typingSpeed = 60,
  pauseMs = 1800
): string {
  const [displayed, setDisplayed] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const pausingRef = useRef(false);

  useEffect(() => {
    if (!texts || texts.length === 0) return;

    // prefers-reduced-motion kontrolü
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setDisplayed(texts[0] ?? "");
      return;
    }

    const tick = () => {
      const currentText = texts[textIndexRef.current] ?? "";

      if (pausingRef.current) {
        // Bekleme bitti → sonraki metne geç
        pausingRef.current = false;
        charIndexRef.current = 0;
        textIndexRef.current = (textIndexRef.current + 1) % texts.length;
        setDisplayed("");
        timerRef.current = setTimeout(tick, typingSpeed);
        return;
      }

      if (charIndexRef.current <= currentText.length) {
        setDisplayed(currentText.slice(0, charIndexRef.current));
        charIndexRef.current += 1;

        if (charIndexRef.current > currentText.length) {
          // Metin tamamlandı → durakla
          pausingRef.current = true;
          timerRef.current = setTimeout(tick, pauseMs);
        } else {
          timerRef.current = setTimeout(tick, typingSpeed);
        }
      }
    };

    // Başlangıç durumunu sıfırla
    textIndexRef.current = 0;
    charIndexRef.current = 0;
    pausingRef.current = false;
    setDisplayed("");

    timerRef.current = setTimeout(tick, typingSpeed);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
    // texts referansı değişirse yeniden başlat; hız parametreleri başlangıçta sabit kabul edilir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texts]);

  return displayed;
}
