import "server-only";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireRole";
import { faturaOlustur } from "@/lib/fatura/olustur";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ randevuId: string }> },
) {
  const { randevuId } = await params;
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  if (!user || user.role !== "admin") {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    const sonuc = await faturaOlustur(randevuId, supabase);
    return Response.json(sonuc);
  } catch (err) {
    const mesaj = err instanceof Error ? err.message : "Fatura oluşturulamadı";
    return Response.json({ error: mesaj }, { status: 500 });
  }
}
