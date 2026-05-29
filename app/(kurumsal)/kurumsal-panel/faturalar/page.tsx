import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import FaturalarKlient from "@/components/kurumsal/FaturalarKlient"

export const metadata = { title: "Faturalar — MindBridger Kurumsal" }

export default async function FaturalarPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/giris")

  const { data: hesap } = await supabase
    .from("kurumsal_hesaplar")
    .select("id")
    .eq("contact_email", user.email ?? "")
    .single()

  if (!hesap) notFound()

  const { data: faturalar } = await supabase
    .from("seans_faturalari")
    .select(
      "id, invoice_number, period_start, period_end, amount, pdf_url, sent_at"
    )
    .eq("kurumsal_id", hesap.id)
    .eq("invoice_type", "kurumsal_aylik")
    .order("period_start", { ascending: false })

  const liste = (faturalar ?? []).map((f) => ({
    id: f.id,
    invoiceNumber: f.invoice_number ?? "",
    periodStart: f.period_start ?? null,
    periodEnd: f.period_end ?? null,
    amount: f.amount ?? 0,
    pdfUrl: f.pdf_url ?? null,
    sentAt: f.sent_at ?? null,
  }))

  return <FaturalarKlient faturalar={liste} />
}
