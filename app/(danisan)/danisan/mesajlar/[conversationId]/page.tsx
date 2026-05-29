import "server-only";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import MesajlasmaKlient from "@/components/danisan/MesajlasmaKlient";

export const metadata = { title: "Mesajlaşma — Danışman | MindBridger" };

interface PageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function DanisanMesajlasmaPage({ params }: PageProps) {
  const { conversationId } = await params;
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

  // Konuşmayı getir ve sahiplik doğrula
  const { data: konusma, error: konusmaHata } = await supabase
    .from("conversations")
    .select("id, type, musteri_id, danisan_id")
    .eq("id", conversationId)
    .eq("danisan_id", danisanRow.id)
    .is("deleted_at", null)
    .single();

  if (konusmaHata || !konusma) notFound();

  // Müşteri profil bilgisi
  const { data: musteriProfil } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url, phone")
    .eq("id", konusma.musteri_id)
    .single();

  // Mesajları getir (ve okunmamışları işaretle)
  const { data: mesajlar } = await supabase
    .from("messages")
    .select("id, sender_id, content, audio_url, is_session_response, read_at, created_at")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  // Okunmamış mesajları işaretle (gönderen danışman değilse)
  const okunmamisIds = (mesajlar ?? [])
    .filter((m) => m.sender_id !== user.id && m.read_at === null)
    .map((m) => m.id);

  if (okunmamisIds.length > 0) {
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", okunmamisIds);
  }

  return (
    <MesajlasmaKlient
      konusmaId={conversationId}
      konusmaTip={konusma.type}
      benimId={user.id}
      karsiTaraf={
        musteriProfil
          ? {
              id: musteriProfil.id,
              isim:
                `${musteriProfil.first_name ?? ""} ${musteriProfil.last_name ?? ""}`.trim() ||
                "(adsız)",
              avatarUrl: musteriProfil.avatar_url ?? null,
              telefon: musteriProfil.phone ?? null,
            }
          : {
              id: konusma.musteri_id,
              isim: "(adsız)",
              avatarUrl: null,
              telefon: null,
            }
      }
      mesajlarBaslangic={(mesajlar ?? []).map((m) => ({
        id: m.id,
        sender_id: m.sender_id,
        benimMesajim: m.sender_id === user.id,
        content: m.content,
        audio_url: m.audio_url,
        is_session_response: m.is_session_response,
        read_at: m.read_at,
        created_at: m.created_at,
      }))}
    />
  );
}
