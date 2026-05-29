"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

// platform_ayarlari'ndaki session_timeout_minutes değeriyle uyumlu: 30 dk
const IDLE_LIMIT_MS = 30 * 60 * 1000;

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "wheel",
  "focus",
] as const;

export default function IdleTimeout() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Kullanıcı oturumu yoksa bileşen pasif kalır
    let isActive = false;
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) isActive = true;
    });

    function resetTimer() {
      if (!isActive) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href = "/giris?error=session_expired";
      }, IDLE_LIMIT_MS);
    }

    function handleActivity() {
      resetTimer();
    }

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // İlk yüklemede sayacı başlat
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        isActive = true;
        resetTimer();
      }
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, []);

  return null;
}
