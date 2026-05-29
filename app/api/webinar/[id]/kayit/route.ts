import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

interface Params { params: Promise<{ id: string }> }

interface RpcResult {
  ok?: boolean;
  kayit_id?: string;
  ucretli?: boolean;
  fiyat?: number;
  error?: string;
  http_status: number;
}

export async function POST(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await requireRole(supabase, ["musteri"]);
    if (!user) return Response.json({ error: "Yetkisiz" }, { status: 401 });

    // Atomik kayıt: kapasite kontrolü + insert + count artışı tek DB transaction'ında
    // Race condition önlenir — webinar satırı FOR UPDATE ile kilitlenir
    const { data: sonuc, error } = await supabase
      .rpc("webinar_kayit_ekle", {
        p_webinar_id: id,
        p_musteri_id: user.id,
      });

    if (error) {
      return Response.json({ error: "Kayıt başarısız" }, { status: 500 });
    }

    const result = sonuc as unknown as RpcResult;
    const httpStatus = result.http_status ?? 500;

    if (result.error) {
      return Response.json({ error: result.error }, { status: httpStatus });
    }

    if (result.ucretli) {
      return Response.json({
        ok: true,
        kayit_id: result.kayit_id,
        ucretli: true,
        fiyat: result.fiyat,
        mesaj: "Kayıt oluşturuldu. Ödeme için yönlendiriliyorsunuz.",
      }, { status: 201 });
    }

    return Response.json({ ok: true, kayit_id: result.kayit_id, ucretli: false }, { status: 201 });
  } catch {
    return Response.json({ error: "Kayıt başarısız" }, { status: 500 });
  }
}
