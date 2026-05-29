import "server-only";
import { type NextRequest } from "next/server";
import { createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";

function dogrulaImza(
  secretKey: string,
  iyziRnd: string,
  iyziEventType: string,
  iyziEventData: string,
  gelenImza: string,
): boolean {
  const veri = secretKey + iyziRnd + iyziEventType + iyziEventData;
  const hesaplanan = createHash("sha256").update(veri).digest("base64");
  return hesaplanan === gelenImza;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    let payload: Record<string, string>;

    try {
      payload = JSON.parse(body) as Record<string, string>;
    } catch {
      return Response.json({ error: "Geçersiz JSON" }, { status: 400 });
    }

    const iyziRnd = payload["iyziRnd"] ?? "";
    const iyziEventType = payload["iyziEventType"] ?? "";
    const iyziEventData = payload["iyziEventData"] ?? "";
    const iyziSignature = payload["iyziSignature"] ?? "";

    const secretKey = process.env.IYZICO_SECRET_KEY ?? "";

    if (!dogrulaImza(secretKey, iyziRnd, iyziEventType, iyziEventData, iyziSignature)) {
      return Response.json({ error: "İmza doğrulanamadı" }, { status: 401 });
    }

    const supabase = await createClient();
    let eventData: Record<string, string> = {};

    try {
      eventData = JSON.parse(iyziEventData) as Record<string, string>;
    } catch {
      // eventData string olabilir
    }

    switch (iyziEventType) {
      case "ITEM_MANDATE_PAYMENT_AUTH": {
        // Ön provizyon tamamlandı → authorized
        const paymentId = eventData["paymentId"] ?? "";
        const conversationId = eventData["conversationId"] ?? "";
        if (paymentId && conversationId) {
          await supabase
            .from("payments")
            .update({ status: "authorized", iyzico_payment_id: paymentId })
            .eq("randevu_id", conversationId)
            .eq("status", "pending");
        }
        break;
      }

      case "ITEM_MANDATE_PAYMENT_CAPTURE": {
        // Provizyon kapatıldı → captured
        const paymentId = eventData["paymentId"] ?? "";
        const conversationId = eventData["conversationId"] ?? "";
        if (paymentId && conversationId) {
          await supabase
            .from("payments")
            .update({
              status: "captured",
              iyzico_payment_id: paymentId,
              paid_at: new Date().toISOString(),
              payment_method: "checkout_form",
            })
            .eq("randevu_id", conversationId)
            .in("status", ["pending", "authorized"]);

          await supabase
            .from("randevular")
            .update({ status: "confirmed" })
            .eq("id", conversationId)
            .eq("status", "pending");
        }
        break;
      }

      case "ITEM_MANDATE_PAYMENT_CANCEL": {
        // İptal edildi → failed
        const conversationId = eventData["conversationId"] ?? "";
        if (conversationId) {
          await supabase
            .from("payments")
            .update({ status: "failed" })
            .eq("randevu_id", conversationId)
            .in("status", ["pending", "authorized"]);
        }
        break;
      }

      case "ITEM_MANDATE_PAYMENT_REFUND": {
        // İade tamamlandı → refunds tablosunu güncelle
        const refundId = eventData["refundConversationId"] ?? eventData["paymentTransactionId"] ?? "";
        if (refundId) {
          await supabase
            .from("refunds")
            .update({ status: "completed" })
            .eq("iyzico_refund_id", refundId)
            .eq("status", "pending");
        }
        break;
      }

      default:
        break;
    }

    return Response.json({ received: true });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
