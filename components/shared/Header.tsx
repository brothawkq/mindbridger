"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";

type UserRole = Database["public"]["Enums"]["user_role"];

interface HeaderUser {
  id: string;
  email: string | undefined;
  role: UserRole;
  firstName: string | null;
}

const NAV_LINKS = [
  { href: "/danismanlar", label: "Danışmanlar" },
  { href: "/blog",        label: "Blog"        },
  { href: "/testler",     label: "Testler"     },
  { href: "/kaynaklar",   label: "Kaynaklar"   },
  { href: "/fiyatlandirma", label: "Fiyatlar"  },
];

const ROLE_DASHBOARD: Record<UserRole, string> = {
  admin:     "/admin/dashboard",
  danisan:   "/danisan/dashboard",
  musteri:   "/panelim/dashboard",
  kurumsal:  "/kurumsal-panel/dashboard",
  affiliate: "/affiliate-panel/dashboard",
  visitor:   "/",
};

const HIDDEN_PREFIXES = [
  "/admin",
  "/danisan",
  "/panelim",
  "/kurumsal-panel",
  "/affiliate-panel",
];

export default function Header() {
  const pathname       = usePathname();
  const router         = useRouter();
  const prefersReduced = useReducedMotion();
  const [user,           setUser]           = useState<HeaderUser | null>(null);
  const [isDark,         setIsDark]         = useState(false);
  const [menuOpen,       setMenuOpen]       = useState(false);
  const [mobileNavOpen,  setMobileNavOpen]  = useState(false);
  const [loading,        setLoading]        = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  const supabase = useMemo(() => createClient(), []);

  const isHidden = HIDDEN_PREFIXES.some((p) => pathname.startsWith(p));

  // Sayfa değişince mobil menüyü kapat
  useEffect(() => { setMobileNavOpen(false); }, [pathname]);

  function applyDark(enabled: boolean) {
    document.documentElement.classList.toggle("dark", enabled);
    setIsDark(enabled);
  }

  useEffect(() => {
    let mounted = true;

    const initUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!mounted) return;

        if (authUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, first_name, dark_mode")
            .eq("id", authUser.id)
            .single();

          if (!mounted) return;

          if (profile) {
            setUser({
              id:        authUser.id,
              email:     authUser.email,
              role:      profile.role as UserRole,
              firstName: profile.first_name,
            });
            if (profile.dark_mode) applyDark(true);
          }
        } else {
          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          applyDark(prefersDark);
        }
      } catch (err) {
        console.error("[Header] initUser error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") setUser(null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Mobil menü açıkken body scroll kilitle
  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileNavOpen]);

  const toggleDark = useCallback(() => {
    const next = !isDark;
    applyDark(next);
    if (user) {
      supabase
        .from("profiles")
        .update({ dark_mode: next })
        .eq("id", user.id)
        .then(({ error }) => {
          if (error) console.error("[Header] Dark mode kaydetme hatası:", error.message);
        });
    }
  }, [isDark, user, supabase]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/giris");
    router.refresh();
  }, [supabase, router]);

  if (isHidden) return null;

  const headerBg = "#325343";
  const textColor = "#F5F7F5";
  const navColor  = "rgba(245,247,245,0.8)";

  return (
    <>
      <header
        style={{
          backgroundColor: headerBg,
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-overpass), Overpass, system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 16,
              color: textColor,
              textDecoration: "none",
              letterSpacing: 0.3,
              flexShrink: 0,
            }}
          >
            MindBridger
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex" style={{ alignItems: "center", gap: 0, flex: 1, justifyContent: "center" }}>
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    padding: "6px 12px",
                    fontSize: 13,
                    color: active ? "#A6DE9B" : navColor,
                    fontWeight: active ? 600 : 400,
                    textDecoration: "none",
                    borderBottom: active ? "2px solid #A6DE9B" : "2px solid transparent",
                    transition: "color 0.1s, border-color 0.1s",
                  }}
                  onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLAnchorElement).style.color = "#F5F7F5"; }}
                  onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLAnchorElement).style.color = navColor; }}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Sağ taraf */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              aria-label={isDark ? "Açık moda geç" : "Koyu moda geç"}
              style={{
                width: 32, height: 32,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "transparent",
                border: "1px solid rgba(245,247,245,0.3)",
                color: "rgba(245,247,245,0.7)",
                cursor: "pointer", fontSize: 14, borderRadius: 100,
                transition: "border-color 0.1s",
              }}
            >
              {isDark ? "☀" : "☾"}
            </button>

            {/* Desktop: kullanıcı / giriş butonları */}
            <div className="hidden md:flex" style={{ alignItems: "center", gap: 8 }}>
              {loading ? (
                <div style={{ width: 80, height: 32, background: "rgba(245,247,245,0.15)", borderRadius: 100, opacity: 0.5 }} />
              ) : user ? (
                <div style={{ position: "relative" }} ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-expanded={menuOpen}
                    aria-haspopup="true"
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "6px 14px",
                      background: "transparent",
                      border: "1px solid rgba(245,247,245,0.5)",
                      color: "#F5F7F5",
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                      borderRadius: 100, transition: "background-color 0.1s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(245,247,245,0.08)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                  >
                    {user.firstName ?? user.email?.split("@")[0] ?? "Hesabım"}
                    <span style={{ fontSize: 10 }}>{menuOpen ? "▲" : "▼"}</span>
                  </button>
                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div
                        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                        transition={{ duration: prefersReduced ? 0.01 : 0.12 }}
                        role="menu"
                        style={{
                          position: "absolute", top: "calc(100% + 6px)", right: 0,
                          minWidth: 160, background: "#325343",
                          border: "1px solid rgba(245,247,245,0.15)",
                          borderRadius: 8, overflow: "hidden", zIndex: 100,
                        }}
                      >
                        <Link href={ROLE_DASHBOARD[user.role] ?? "/"} onClick={() => setMenuOpen(false)} role="menuitem" style={menuItemStyle}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(166,222,155,0.1)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent"; }}>
                          Panelime Git
                        </Link>
                        <div style={{ borderTop: "1px solid rgba(245,247,245,0.1)" }} />
                        <button onClick={handleSignOut} role="menuitem"
                          style={{ ...menuItemStyle, width: "100%", textAlign: "left", border: "none", cursor: "pointer", background: "transparent" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(166,222,155,0.1)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}>
                          Çıkış Yap
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <Link href="/giris" style={{ padding: "7px 16px", fontSize: 13, fontWeight: 600, color: "#F5F7F5", border: "1px solid rgba(245,247,245,0.6)", background: "transparent", textDecoration: "none", display: "inline-flex", alignItems: "center", borderRadius: 100, transition: "background-color 0.1s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(245,247,245,0.08)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent"; }}>
                    Giriş
                  </Link>
                  <Link href="/kayit" style={{ padding: "7px 16px", fontSize: 13, fontWeight: 600, color: "#325343", background: "#A6DE9B", border: "none", textDecoration: "none", display: "inline-flex", alignItems: "center", borderRadius: 100, transition: "background-color 0.1s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#8ED485"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#A6DE9B"; }}>
                    Kayıt Ol
                  </Link>
                </div>
              )}
            </div>

            {/* Mobil hamburger */}
            <button
              className="flex md:hidden"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label="Menüyü aç"
              style={{
                width: 36, height: 36,
                alignItems: "center", justifyContent: "center",
                background: "transparent",
                border: "1px solid rgba(245,247,245,0.3)",
                color: "#F5F7F5", cursor: "pointer", borderRadius: 8,
                fontSize: 18,
              }}
            >
              {mobileNavOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </header>

      {/* Mobil Menü Overlay */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: "100%" }}
            transition={{ duration: prefersReduced ? 0.01 : 0.22, ease: "easeOut" }}
            className="md:hidden"
            style={{
              position: "fixed", top: 60, right: 0, bottom: 0,
              width: "80%", maxWidth: 320,
              backgroundColor: "#325343",
              zIndex: 49,
              display: "flex", flexDirection: "column",
              padding: "24px 0",
              boxShadow: "-4px 0 20px rgba(0,0,0,0.3)",
            }}
          >
            {/* Nav linkleri */}
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileNavOpen(false)}
                  style={{
                    padding: "14px 28px",
                    fontSize: 15, fontWeight: active ? 700 : 400,
                    color: active ? "#A6DE9B" : "#F5F7F5",
                    textDecoration: "none",
                    borderLeft: active ? "3px solid #A6DE9B" : "3px solid transparent",
                    transition: "color 0.1s",
                  }}
                >
                  {label}
                </Link>
              );
            })}

            <div style={{ borderTop: "1px solid rgba(245,247,245,0.15)", margin: "16px 0" }} />

            {/* Auth butonları */}
            {!loading && (
              user ? (
                <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <Link
                    href={ROLE_DASHBOARD[user.role] ?? "/"}
                    onClick={() => setMobileNavOpen(false)}
                    style={{ padding: "12px 16px", backgroundColor: "#A6DE9B", color: "#325343", fontSize: 14, fontWeight: 700, textDecoration: "none", textAlign: "center", borderRadius: 8 }}
                  >
                    Panelime Git
                  </Link>
                  <button
                    onClick={() => { setMobileNavOpen(false); handleSignOut(); }}
                    style={{ padding: "12px 16px", backgroundColor: "transparent", border: "1px solid rgba(245,247,245,0.4)", color: "#F5F7F5", fontSize: 14, fontWeight: 600, cursor: "pointer", borderRadius: 8 }}
                  >
                    Çıkış Yap
                  </button>
                </div>
              ) : (
                <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <Link href="/giris" onClick={() => setMobileNavOpen(false)}
                    style={{ padding: "12px 16px", border: "1px solid rgba(245,247,245,0.5)", color: "#F5F7F5", fontSize: 14, fontWeight: 600, textDecoration: "none", textAlign: "center", borderRadius: 8 }}>
                    Giriş Yap
                  </Link>
                  <Link href="/kayit" onClick={() => setMobileNavOpen(false)}
                    style={{ padding: "12px 16px", backgroundColor: "#A6DE9B", color: "#325343", fontSize: 14, fontWeight: 700, textDecoration: "none", textAlign: "center", borderRadius: 8 }}>
                    Kayıt Ol
                  </Link>
                </div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Arka plan karartma */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            className="md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setMobileNavOpen(false)}
            style={{
              position: "fixed", inset: 0, top: 60,
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 48,
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: "block",
  padding: "10px 16px",
  fontSize: 13,
  color: "#F5F7F5",
  textDecoration: "none",
  fontFamily: "inherit",
  transition: "background-color 0.1s",
};
