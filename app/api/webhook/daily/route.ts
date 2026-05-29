import "server-only";
import { type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// Webhook: Daily.co sunucusu tarafından çağrılır, kullanıcı oturumu yoktur.
// Service role client ile RLS bypass edilir.
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase ortam değişkenleri eksik");
  return createClient<Database>(url, key);
}

type DailyEvent =
  | "meeting.started"
  | "meeting.ended"
  | "participant.joined"
  | "participant.left";

interface DailyWebhookPayload {
  event: DailyEvent;
  payload?: {
    room?: { name?: string };
    meeting?: { room?: string; duration?: number };
  };
}

function logExpiry(): string {
  // audit_logs: 90 gün saklama (SCHEMA.md)
  return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
}

export async function POST(req: NextRequest) {
  const secret = process.env.DAILY_CO_WEBHOOK_SECRET;
  const signature = req.headers.get("x-webhook-signature");
  const rawBody = await req.text();

  // DEN-19: İmza doğrulaması her zaman zorunlu — secret tanımlı değilse 500 döndür.
  if (!secret) {
    console.error("[daily-webhook] DAILY_CO_WEBHOOK_SECRET tanımlı değil");
    return Response.json({ error: "Sunucu yapılandırma hatası" }, { status: 500 });
  }
  if (!signature) {
    return Response.json({ error: "İmza eksik" }, { status: 401 });
  }
  const { createHmac, timingSafeEqual } = await import("crypto");
  const beklenen = createHmac("sha256", secret).update(rawBody).digest("hex");
  // DEN-19: timing-safe karşılaştırma — string == ile imza bilgisi sızdırılabilir
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(beklenen))) {
    return Response.json({ error: "Geçersiz imza" }, { status: 401 });
  }

  let data: DailyWebhookPayload;
  try {
    data = JSON.parse(rawBody) as DailyWebhookPayload;
  } catch {
    return Response.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const supabase = getServiceClient();

  try {
    switch (data.event) {
      case "meeting.started": {
        const odaAdi = data.payload?.room?.name;
        if (odaAdi) {
          await supabase.from("audit_logs").insert({
            action:      "seans_baslat",
            table_name:  "randevular",
            new_values:  { daily_room_name: odaAdi },
            expires_at:  logExpiry(),
          });
        }
        break;
      }

      case "meeting.ended": {
        const odaAdi =
          data.payload?.room?.name ?? data.payload?.meeting?.room;
        if (!odaAdi) break;

        const { data: randevu } = await supabase
          .from("randevular")
          .select("id, status")
          .eq("daily_room_name", odaAdi)
          .is("deleted_at", null)
          .single();

        if (randevu?.status === "confirmed") {
          await supabase
            .from("randevular")
            .update({ status: "completed" })
            .eq("id", randevu.id);
        }

        await supabase.from("audit_logs").insert({
          action:      "seans_bitir",
          table_name:  "randevular",
          record_id:   randevu?.id ?? undefined,
          new_values:  {
            daily_room_name:   odaAdi,
            duration_seconds:  data.payload?.meeting?.duration ?? null,
          },
          expires_at:  logExpiry(),
        });
        break;
      }

      default:
        break;
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "İşlem hatası" }, { status: 500 });
  }
}
