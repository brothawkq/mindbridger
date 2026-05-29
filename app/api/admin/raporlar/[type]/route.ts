import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/requireRole";

const VALID_TYPES = ["komisyon", "gelir", "vergi", "affiliate", "kurumsal"] as const;
type RaporTip = (typeof VALID_TYPES)[number];

function escCsv(v: string | number | null | undefined): string {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(...cols: Array<string | number | null | undefined>): string {
  return cols.map(escCsv).join(",");
}

function fmt(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()}`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const supabase = await createClient();
  const user = await requireRole(supabase, ["admin"]);
  if (!user) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const { type } = await params;
  if (!(VALID_TYPES as readonly string[]).includes(type)) {
    return NextResponse.json({ hata: "Geçersiz rapor türü." }, { status: 400 });
  }
  const tip = type as RaporTip;

  const { searchParams } = req.nextUrl;
  const baslangic = searchParams.get("baslangic") ?? "";
  const bitis = searchParams.get("bitis") ?? "";

  let csv = "";
  let filename = "";

  if (tip === "komisyon" || tip === "gelir" || tip === "vergi") {
    let q = supabase
      .from("payments")
      .select(
        "id, amount_gross, commission_amount, amount_net, status, paid_at, created_at, musteri_id, danisan_id"
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (baslangic) q = q.gte("created_at", baslangic);
    if (bitis) q = q.lte("created_at", bitis);

    const { data: payments } = await q;

    if (tip === "komisyon") {
      filename = "komisyon-raporu.csv";
      const lines = [
        row("Tarih", "Brüt (TL)", "Komisyon (TL)", "Net (TL)", "Durum"),
        ...(payments ?? []).map((p) =>
          row(fmt(p.paid_at ?? p.created_at), p.amount_gross, p.commission_amount, p.amount_net, p.status)
        ),
      ];
      const total = (payments ?? []).reduce(
        (a, p) => ({
          brut: a.brut + Number(p.amount_gross ?? 0),
          kom: a.kom + Number(p.commission_amount ?? 0),
          net: a.net + Number(p.amount_net ?? 0),
        }),
        { brut: 0, kom: 0, net: 0 }
      );
      lines.push(row("TOPLAM", total.brut.toFixed(2), total.kom.toFixed(2), total.net.toFixed(2), ""));
      csv = lines.join("\n");
    }

    if (tip === "gelir") {
      filename = "gelir-raporu.csv";
      const lines = [
        row("Tarih", "Brüt (TL)", "Komisyon (TL)", "Net Danışman (TL)", "Durum"),
        ...(payments ?? []).map((p) =>
          row(fmt(p.paid_at ?? p.created_at), p.amount_gross, p.commission_amount, p.amount_net, p.status)
        ),
      ];
      csv = lines.join("\n");
    }

    if (tip === "vergi") {
      filename = "vergi-raporu.csv";
      const lines = [
        row("Tarih", "İşlem ID", "Brüt (TL)", "KDV Dahil Komisyon (TL)", "Durum"),
        ...(payments ?? []).map((p) => {
          const kom = Number(p.commission_amount ?? 0);
          const kdvli = (kom * 1.2).toFixed(2);
          return row(fmt(p.paid_at ?? p.created_at), p.id, p.amount_gross, kdvli, p.status);
        }),
      ];
      csv = lines.join("\n");
    }
  }

  if (tip === "affiliate") {
    filename = "affiliate-raporu.csv";
    const { data: convs } = await supabase
      .from("affiliate_conversions")
      .select("id, affiliate_id, commission_amount, status, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    const lines = [
      row("Tarih", "Dönüşüm ID", "Komisyon (TL)", "Durum"),
      ...(convs ?? []).map((c) =>
        row(fmt(c.created_at), c.id, c.commission_amount, c.status)
      ),
    ];
    csv = lines.join("\n");
  }

  if (tip === "kurumsal") {
    filename = "kurumsal-raporu.csv";
    const { data: seans } = await supabase
      .from("seans_faturalari")
      .select("id, invoice_number, amount, invoice_type, created_at")
      .eq("invoice_type", "kurumsal_aylik")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    const lines = [
      row("Tarih", "Fatura No", "Tutar (TL)", "Tip"),
      ...(seans ?? []).map((s) =>
        row(fmt(s.created_at), s.invoice_number, s.amount, s.invoice_type)
      ),
    ];
    csv = lines.join("\n");
  }

  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
