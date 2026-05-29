import "server-only";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";
import MusteriMesajlasmaKlient from "@/components/musteri/MusteriMesajlasmaKlient";

export const metadata = { title: "Mesajlaşma — Müşteri | MindBridger" };

interface PageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function MusteriMesajlasmaPage({ params }: PageProps) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const user = await requireRole(supabase, ["musteri"]);
  if (!user) redirect("/giris");

  const { data: konusma, error: konusmaHata } = await supabase
    .from("conversations")
    .select("id, type, musteri_id, danisan_id")
    .eq("id", conversationId)
    .eq("musteri_id", user.id)
    .is("deleted_at", null)
    .single();

  if (konusmaHata || !konusma) notFound();

  type DanisanRow = {
    id: string;
    slug: string;
    title: string | null;
    profiles: { first_name: string | null; last_name: string | null; avatar_url: string | null } | null;
  };

  const { data: danisanRaw } = await supabase
    .from("danisanlar")
    .select("id, slug, title, profiles:profile_id(first_name, last_name, avatar_url)")
    .eq("id", konusma.danisan_id)
    .single();

  const danisan = danisanRaw as unknown as DanisanRow | null;

  const { data: mesajlar } = await supabase
    .from("messages")
    .select("id, sender_id, content, audio_url, is_session_response, read_at, created_at")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  const okunmamisIds = (mesajlar ?? [])
    .filter((m) => m.sender_id !== user.id && m.read_at === null)
    .map((m) => m.id);

  if (okunmamisIds.length > 0) {
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", okunmamisIds);
  }

  const danisanIsim = danisan
    ? `${danisan.profiles?.first_name ?? ""} ${danisan.profiles?.last_name ?? ""}`.trim() ||
      danisan.title ||
      "(adsız)"
    : "(adsız)";

  return (
    <MusteriMesajlasmaKlient
      konusmaId={conversationId}
      konusmaTip={konusma.type}
      benimId={user.id}
      karsiTaraf={{
        slug: danisan?.slug ?? "",
        isim: danisanIsim,
        avatarUrl: danisan?.profiles?.avatar_url ?? null,
      }}
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
