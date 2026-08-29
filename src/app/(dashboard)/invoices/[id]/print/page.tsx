import { notFound } from "next/navigation";
import Link from "next/link";
import { Printer } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { InvoiceDocument } from "@/components/invoice/invoice-document";
import { AutoPrint } from "@/components/invoice/auto-print";
import type { InvoiceWithStudent } from "@/lib/types";

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const settings = await getSettings();

  const { data } = await supabase
    .from("invoices")
    .select(
      "*, student:students(id, student_id, student_name, parent_name, parent_phone, parent_email, class, section, academic_year, address), items:invoice_items(fee_type, description, amount)"
    )
    .eq("id", id)
    .maybeSingle();

  const invoice = (data ?? null) as unknown as InvoiceWithStudent | null;

  if (!invoice) notFound();

  return (
    <div className="min-h-screen bg-slate-100 py-8">
      <AutoPrint />
      <div className="no-print mx-auto mb-4 flex max-w-[800px] items-center justify-between px-2">
        <Link href={`/invoices/${id}`} className="text-sm font-medium text-slate-600 hover:text-slate-900">
          ← Back to invoice
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          <Printer className="h-4 w-4" />
          Print / Save as PDF
        </button>
      </div>

      <InvoiceDocument
        invoice={{
          invoice_number: invoice.invoice_number,
          invoice_date: invoice.invoice_date,
          academic_year: invoice.academic_year,
          status: invoice.status,
          notes: invoice.notes,
          subtotal: Number(invoice.subtotal),
          discount: Number(invoice.discount),
          previous_due: Number(invoice.previous_due),
          total_amount: Number(invoice.total_amount),
          amount_paid: Number(invoice.amount_paid),
          balance: Number(invoice.balance),
          payment_method: invoice.payment_method,
        }}
        student={{
          student_name: invoice.student?.student_name ?? "",
          student_id: invoice.student?.student_id ?? "",
          class: invoice.student?.class ?? "",
          section: invoice.student?.section ?? "",
          parent_name: invoice.student?.parent_name ?? "",
          parent_phone: invoice.student?.parent_phone ?? "",
          parent_email: invoice.student?.parent_email ?? null,
          address: invoice.student?.address ?? null,
        }}
        items={(invoice.items ?? []).map((it: { fee_type: string; description: string | null; amount: number }) => ({
          fee_type: it.fee_type,
          description: it.description,
          amount: Number(it.amount),
        }))}
        settings={settings}
      />
    </div>
  );
}