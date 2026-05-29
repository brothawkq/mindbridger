import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import MesajlarKlient from "@/components/danisan/MesajlarKlient";

export const metadata = { title: "Mesajlar — Danışman | MindBridger" };

export default async function DanisanMesajlarPage() {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["danisan"]);
  if (!user) redirect("/giris");

  const { data: danisanRow } = await supabase
    .from("danisanlar")
    .select("id")
    .eq("profile_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!danisanRow) redirect("/danisan/profil");

  const { data: konusmalar } = await supabase
    .from("conversations")
    .select("id, type, last_message_at, musteri_id")
    .eq("danisan_id", danisanRow.id)
    .is("deleted_at", null)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  const musteriIds = [
    ...new Set((konusmalar ?? []).map((k) => k.musteri_id)),
  ];

  let profilMap = new Map<string, { isim: string; avatarUrl: string | null }>();
  if (musteriIds.length > 0) {
    const { data: profiller } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .in("id", musteriIds);
    profilMap = new Map(
      (profiller ?? []).map((p) => [
        p.id,
        {
          isim: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "(adsız)",
          avatarUrl: p.avatar_url ?? null,
        },
      ])
    );
  }

  // Okunmamış mesaj sayısı
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
    musteriId: k.musteri_id,
    musteriIsim: profilMap.get(k.musteri_id)?.isim ?? "(adsız)",
    musteriAvatarUrl: profilMap.get(k.musteri_id)?.avatarUrl ?? null,
    okunmamisSayi: unreadMap.get(k.id) ?? 0,
    sonMesaj: lastMsgMap.get(k.id) ?? null,
  }));

  return <MesajlarKlient konusmalar={konusmalarZengin} />;
}
