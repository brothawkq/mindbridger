"use client";

import { useEffect, useRef, useState } from "react";

/**
 * useCountUp — Sayıyı 0'dan hedefe animasyonlu olarak sayar.
 * prefers-reduced-motion aktifse anında hedef değeri döner.
 *
 * @param target   - Hedef sayı
 * @param duration - Animasyon süresi (ms), varsayılan 800
 * @param trigger  - true olduğunda animasyonu başlatır (false → 0 döner)
 */
export function useCountUp(
  target: number,
  duration = 800,
  trigger = false
): number {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // prefers-reduced-motion kontrolü
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!trigger) {
      setCount(0);
      return;
    }

    if (prefersReduced) {
      setCount(target);
      return;
    }

    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target, duration, trigger]);

  return count;
}
