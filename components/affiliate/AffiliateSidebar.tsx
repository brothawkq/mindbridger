"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const NAV = [
  {
    bolum: "Ana Menü",
    items: [
      { href: "/affiliate-panel/dashboard", label: "Dashboard" },
      { href: "/affiliate-panel/linklerim", label: "Linklerim" },
    ],
  },
  {
    bolum: "Gelirler",
    items: [{ href: "/affiliate-panel/kazanclar", label: "Kazançlar" }],
  },
  {
    bolum: "Hesap",
    items: [
      { href: "/affiliate-panel/ayarlar", label: "Ayarlar" },
      { href: "/iletisim", label: "Destek & İletişim" },
    ],
  },
]

interface Props {
  adSoyad: string
}

export default function AffiliateSidebar({ adSoyad }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function cikisYap() {
    await supabase.auth.signOut()
    router.push("/giris")
    router.refresh()
  }

  return (
    <aside className="w-[190px] flex-shrink-0 border-r-[1.5px] border-[#E0E0E0] bg-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-3.5 pt-3.5 pb-2">
        <div className="border-[1.5px] border-dashed border-[#BDBDBD] text-center py-1.5 text-[12px] text-[#BDBDBD] tracking-[0.5px]">
          MindBridger
        </div>
      </div>

      {/* User */}
      <div className="px-3.5 pb-2">
        <div className="text-[9px] font-bold tracking-[1px] uppercase text-[#BDBDBD] mb-0.5">
          Affiliate
        </div>
        <div className="text-[12px] font-bold text-[#212121] truncate">
          {adSoyad}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3.5 overflow-y-auto pb-4">
        {NAV.map((grup) => (
          <div key={grup.bolum}>
            <div className="text-[9px] font-bold tracking-[1px] uppercase text-[#BDBDBD] border-b border-dotted border-[#E0E0E0] pb-0.5 mt-2.5 mb-1.5">
              {grup.bolum}
            </div>
            {grup.items.map((item) => {
              const aktif =
                pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 py-1 text-[12px] text-[#212121] ${
                    aktif ? "font-bold" : "hover:opacity-70"
                  }`}
                >
                  <span
                    className={`text-[10px] font-mono w-3.5 flex-shrink-0 ${
                      aktif ? "text-[#212121]" : "text-[#BDBDBD]"
                    }`}
                  >
                    {aktif ? "[+]" : "[]"}
                  </span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3.5 py-3 border-t border-[#E0E0E0]">
        <button
          onClick={cikisYap}
          className="flex items-center gap-1.5 text-[11.5px] text-[#BDBDBD] w-full hover:text-[#212121] transition-colors"
        >
          <span className="text-[10px] font-mono">[]</span>
          Çıkış Yap →
        </button>
      </div>
    </aside>
  )
}
