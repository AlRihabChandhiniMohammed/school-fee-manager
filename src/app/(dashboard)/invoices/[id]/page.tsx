import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui/page-header";
import { InvoiceDocument } from "@/components/invoice/invoice-document";
import { InvoiceActionBar, type InvoiceDetailData } from "@/components/invoice/invoice-action-bar";
import { formatCurrency, formatDate } from "@/lib/format";
import type { InvoiceWithStudent } from "@/lib/types";

export const metadata = { title: "Invoice" };

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const settings = await getSettings();
  const currency = settings.currency;

  const { data } = await supabase
    .from("invoices")
    .select(
      "*, student:students(id, student_name, parent_name, parent_phone, parent_email, academic_year, address), items:invoice_items(id, fee_type, description, amount), payments(id, amount, payment_method, transaction_reference, payment_date, notes)"
    )
    .eq("id", id)
    .maybeSingle();

  const invoice = (data ?? null) as unknown as InvoiceWithStudent | null;

  if (!invoice) notFound();

  const actionData: InvoiceDetailData = {
    id: invoice.id,
    invoice_number: invoice.invoice_number,
    invoice_date: invoice.invoice_date,
    status: invoice.status,
    academic_year: invoice.academic_year,
    student: {
      student_name: invoice.student?.student_name ?? "",
      parent_name: invoice.student?.parent_name ?? "",
      parent_phone: invoice.student?.parent_phone ?? "",
      parent_email: invoice.student?.parent_email ?? null,
      address: invoice.student?.address ?? null,
    },
    items: (invoice.items ?? []).map((it: { fee_type: string; description: string | null; amount: number }) => ({
      fee_type: it.fee_type,
      description: it.description,
      amount: Number(it.amount),
    })),
    totals: {
      subtotal: Number(invoice.subtotal),
      discount: Number(invoice.discount),
      total: Number(invoice.total_amount),
      paid: Number(invoice.amount_paid),
      balance: Number(invoice.balance),
    },
    notes: invoice.notes,
  };

  return (
    <div>
      <PageHeader
        title={`Invoice ${invoice.invoice_number}`}
        description="Download, print or edit this invoice."
        actions={<InvoiceActionBar invoice={actionData} settings={settings} />}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <InvoiceDocument
            invoice={{
              invoice_number: invoice.invoice_number,
              invoice_date: invoice.invoice_date,
              academic_year: invoice.academic_year,
              status: invoice.status,
              notes: invoice.notes,
              subtotal: Number(invoice.subtotal),
              discount: Number(invoice.discount),
              total_amount: Number(invoice.total_amount),
              amount_paid: Number(invoice.amount_paid),
              balance: Number(invoice.balance),
              payment_method: invoice.payment_method,
            }}
            student={actionData.student}
            items={actionData.items}
            settings={settings}
          />
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Payment Information
            </h2>
            <dl className="space-y-2 text-sm">
              <Row label="Method" value={invoice.payment_method ?? "—"} />
              <Row
                label="Reference"
                value={invoice.transaction_reference ?? "—"}
              />
              <Row label="Amount Paid" value={formatCurrency(Number(invoice.amount_paid), currency)} />
              <Row label="Balance Due" value={formatCurrency(Number(invoice.balance), currency)} />
              <Row label="Date" value={formatDate(invoice.invoice_date)} />
            </dl>
            {(invoice.payments ?? []).length > 0 && (
              <>
                <h3 className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Payments
                </h3>
                {(invoice.payments ?? []).map((p: { id: string; amount: number; payment_method: string | null; payment_date: string }) => (
                  <div
                    key={p.id}
                    className="mb-1 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-emerald-800">
                      {formatCurrency(Number(p.amount), currency)}
                    </span>
                    <span className="text-xs text-emerald-600">
                      {p.payment_method ?? "—"} • {formatDate(p.payment_date)}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Student
            </h2>
            <p className="text-sm font-semibold text-slate-900">{invoice.student?.student_name}</p>
            <Link
              href={`/students/${invoice.student?.id}`}
              className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              View student profile →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}