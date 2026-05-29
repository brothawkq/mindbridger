import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import MusteriMesajlarKlient from "@/components/musteri/MusteriMesajlarKlient";

export const metadata = { title: "Mesajlar — Müşteri | MindBridger" };

export default async function MusteriMesajlarPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) redirect("/giris");

  const { data: konusmalar } = await supabase
    .from("conversations")
    .select("id, type, last_message_at, danisan_id")
    .eq("musteri_id", user.id)
    .is("deleted_at", null)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  const danisanIds = [
    ...new Set((konusmalar ?? []).map((k) => k.danisan_id)),
  ];

  type DanisanRow = {
    id: string;
    slug: string;
    title: string | null;
    profiles: { first_name: string | null; last_name: string | null; avatar_url: string | null } | null;
  };

  let danisanMap = new Map<string, { isim: string; slug: string }>();
  if (danisanIds.length > 0) {
    const { data: danisanlar } = await supabase
      .from("danisanlar")
      .select("id, slug, title, profiles:profile_id(first_name, last_name, avatar_url)")
      .in("id", danisanIds);
    danisanMap = new Map(
      ((danisanlar ?? []) as unknown as DanisanRow[]).map((d) => [
        d.id,
        {
          isim:
            `${d.profiles?.first_name ?? ""} ${d.profiles?.last_name ?? ""}`.trim() ||
            d.title ||
            "(adsız)",
          slug: d.slug,
        },
      ])
    );
  }

  const konusmaIds = (konusmalar ?? []).map((k) => k.id);
  let unreadMap = new Map<string, number>();
  let lastMsgMap = new Map<string, string | null>();

  if (konusmaIds.length > 0) {
    const { data: mesajlar } = await supabase
      .from("messages")
      .select("conversation_id, sender_id, content, read_at")
      .in("conversation_id", konusmaIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    for (const m of mesajlar ?? []) {
      if (!lastMsgMap.has(m.conversation_id)) {
        lastMsgMap.set(m.conversation_id, m.content);
      }
      if (m.sender_id !== user.id && m.read_at === null) {
        unreadMap.set(
          m.conversation_id,
          (unreadMap.get(m.conversation_id) ?? 0) + 1
        );
      }
    }
  }

  const konusmalarZengin = (konusmalar ?? []).map((k) => ({
    id: k.id,
    type: k.type as "lojistik" | "asenkron_seans",
    last_message_at: k.last_message_at,
    danisanId: k.danisan_id,
    danisanIsim: danisanMap.get(k.danisan_id)?.isim ?? "(adsız)",
    okunmamisSayi: unreadMap.get(k.id) ?? 0,
    sonMesaj: lastMsgMap.get(k.id) ?? null,
  }));

  return <MusteriMesajlarKlient konusmalar={konusmalarZengin} />;
}
