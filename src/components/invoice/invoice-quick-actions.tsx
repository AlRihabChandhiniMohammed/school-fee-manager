"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, Download, Printer, Loader2 } from "lucide-react";
import type { SchoolSettings } from "@/lib/types";
import { downloadInvoicePdf, type PdfInvoiceData } from "@/lib/pdf";
import { useToast } from "@/components/ui/toast";

export function InvoiceQuickActions({
  invoiceId,
  settings,
}: {
  invoiceId: string;
  settings: SchoolSettings;
}) {
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load invoice");
      const invoice = await res.json();

      const pdfData: PdfInvoiceData = {
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        status: invoice.status,
        academic_year: invoice.academic_year,
        student: {
          student_name: invoice.student.student_name,
          parent_name: invoice.student.parent_name,
          parent_phone: invoice.student.parent_phone,
          parent_email: invoice.student.parent_email,
        },
        items: invoice.items.map(
          (it: { fee_type: string; description: string | null; amount: number | string }) => ({
            fee_type: it.fee_type,
            description: it.description,
            amount: Number(it.amount),
          })
        ),
        totals: {
          subtotal: Number(invoice.subtotal),
          discount: Number(invoice.discount),
          previous_due: Number(invoice.previous_due),
          total: Number(invoice.total_amount),
          paid: Number(invoice.amount_paid),
          balance: Number(invoice.balance),
        },
        notes: invoice.notes,
      };

      await downloadInvoicePdf(pdfData, settings);
      toast("success", "PDF downloaded");
    } catch {
      toast("error", "Could not download the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/invoices/${invoiceId}`}
        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
        title="View invoice"
        aria-label="View invoice"
      >
        <Eye className="h-4 w-4" />
      </Link>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600 disabled:opacity-50"
        title="Download PDF"
        aria-label="Download PDF"
      >
        {downloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </button>
      <Link
        href={`/invoices/${invoiceId}/print`}
        target="_blank"
        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
        title="Print"
        aria-label="Print"
      >
        <Printer className="h-4 w-4" />
      </Link>
    </div>
  );
}