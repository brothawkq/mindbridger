import "server-only";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireRole";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await requireAuth(supabase);

  if (!user || !["musteri", "danisan", "admin"].includes(user.role)) {
    return Response.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    const { data: fatura } = await supabase
      .from("seans_faturalari")
      .select("id, invoice_number, pdf_url, musteri_id, danisan_id")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (!fatura || !fatura.pdf_url) {
      return Response.json({ error: "Fatura bulunamadı" }, { status: 404 });
    }

    // Sahiplik kontrolü
    if (user.role === "musteri" && fatura.musteri_id !== user.id) {
      return Response.json({ error: "Yetkisiz" }, { status: 403 });
    }
    if (user.role === "danisan") {
      const { data: danisanRow } = await supabase
        .from("danisanlar")
        .select("id")
        .eq("profile_id", user.id)
        .is("deleted_at", null)
        .single();
      if (!danisanRow || fatura.danisan_id !== danisanRow.id) {
        return Response.json({ error: "Yetkisiz" }, { status: 403 });
      }
    }

    // PDF'i Storage'dan indir
    const url = new URL(fatura.pdf_url);
    const storagePath = url.pathname.split("/faturalar/")[1];

    if (!storagePath) {
      return Response.json({ error: "Geçersiz PDF yolu" }, { status: 500 });
    }

    const { data: dosya, error: indirmeHata } = await supabase.storage
      .from("faturalar")
      .download(storagePath);

    if (indirmeHata || !dosya) {
      return Response.json({ error: "PDF indirilemedi" }, { status: 500 });
    }

    const buffer = Buffer.from(await dosya.arrayBuffer());

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fatura.invoice_number}.pdf"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return Response.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
