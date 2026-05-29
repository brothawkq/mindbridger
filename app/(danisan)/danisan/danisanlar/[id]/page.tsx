import "server-only";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/requireRole";
import DanisanDetayiKlient from "@/components/danisan/DanisanDetayiKlient";

export const metadata = { title: "Danışan Detayı — Danışman | MindBridger" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DanisanDetayiPage({ params }: PageProps) {
  const { id: musteriId } = await params;
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

  // Verify this musteri has had at least one randevu with this danisan
  const { data: ilkRandevu } = await supabase
    .from("randevular")
    .select("id")
    .eq("danisan_id", danisanRow.id)
    .eq("musteri_id", musteriId)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (!ilkRandevu) notFound();

  // Admin client: notes_private için DB-level REVOKE authenticated bypass
  const adminSupabase = createAdminClient();

  const [profilRes, randevularRes, odevlerRes, gunlukRes] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        `id, first_name, last_name, avatar_url, phone,
         churn_risk_score, created_at, last_login_at`
      )
      .eq("id", musteriId)
      .is("deleted_at", null)
      .single(),

    adminSupabase
      .from("randevular")
      .select(
        `id, status, session_type, scheduled_at, duration_minutes,
         price, summary_shared, notes_private`
      )
      .eq("danisan_id", danisanRow.id)   // explicit filter — RLS bypass edildiği için zorunlu
      .eq("musteri_id", musteriId)
      .is("deleted_at", null)
      .order("scheduled_at", { ascending: false })
      .limit(50),

    supabase
      .from("odevler")
      .select("id, title, description, due_date, status, completed_at, musteri_note")
      .eq("danisan_id", danisanRow.id)
      .eq("musteri_id", musteriId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),

    supabase
      .from("gunluk_kayitlar")
      .select("id, date, mood, mood_emoji, note, created_at")
      .eq("musteri_id", musteriId)
      .eq("shared_with_danisan_id", danisanRow.id)
      .is("deleted_at", null)
      .order("date", { ascending: false })
      .limit(30),
  ]);

  if (!profilRes.data) notFound();

  const profil = profilRes.data;

  return (
    <DanisanDetayiKlient
      musteri={{
        id: profil.id,
        isim: `${profil.first_name ?? ""} ${profil.last_name ?? ""}`.trim() || "(adsız)",
        avatarUrl: profil.avatar_url ?? null,
        telefon: profil.phone ?? null,
        churnRiskScore: profil.churn_risk_score ?? 0,
        kayitTarihi: profil.created_at,
        sonGirisTarihi: profil.last_login_at ?? null,
      }}
      randevular={(randevularRes.data ?? []).map((r) => ({
        id: r.id,
        status: r.status,
        session_type: r.session_type,
        scheduled_at: r.scheduled_at,
        duration_minutes: r.duration_minutes,
        price: r.price,
        summary_shared: r.summary_shared,
        notes_private: r.notes_private,
      }))}
      odevler={(odevlerRes.data ?? []).map((o) => ({
        id: o.id,
        title: o.title,
        description: o.description ?? null,
        due_date: o.due_date ?? null,
        status: o.status,
        completed_at: o.completed_at ?? null,
        musteri_note: o.musteri_note ?? null,
      }))}
      gunlukKayitlar={(gunlukRes.data ?? []).map((g) => ({
        id: g.id,
        date: g.date,
        mood: g.mood ?? null,
        mood_emoji: g.mood_emoji ?? null,
        note: g.note ?? null,
        created_at: g.created_at,
      }))}
    />
  );
}
