import Link from "next/link";
import { Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { FeeFilters } from "@/components/fees/fee-filters";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/format";
import type { FeeLedgerRow } from "@/lib/types";

export const metadata = { title: "Fees" };

export default async function FeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const settings = await getSettings();
  const currency = settings.currency;

  let query = supabase
    .from("invoice_items")
    .select(
      "id, fee_type, description, amount, invoice:invoices(id, invoice_number, invoice_date, academic_year, total_amount, amount_paid, balance, status, student:students(id, student_name, parent_name))"
    )
    .order("invoice_id", { ascending: false })
    .limit(200);

  const term = sp.q?.trim();
  if (term) {
    const escaped = term.replace(/'/g, "''");
    query = query.or(
      `fee_type.ilike.%${escaped}%,description.ilike.%${escaped}%,invoice.invoice_number.ilike.%${escaped}%,invoice.student.student_name.ilike.%${escaped}%`
    );
  }
  if (sp.status) query = query.eq("invoice.status", sp.status);
  if (sp.year) query = query.eq("invoice.academic_year", sp.year);

  const { data: fees, error } = await query.returns<FeeLedgerRow[]>();

  const totalCharged = (fees ?? []).reduce((s, f) => s + Number(f.amount), 0);

  return (
    <div>
      <PageHeader
        title="Fees"
        description="Complete ledger of fee items recorded across all invoices."
        actions={
          <Link href="/invoices/new">
            <Button variant="success">+ Record Fee</Button>
          </Link>
        }
      />

      <FeeFilters />

      {error ? (
        <EmptyState title="Could not load fees" description={error.message} />
      ) : !fees || fees.length === 0 ? (
        <EmptyState
          icon={<Wallet className="h-7 w-7" />}
          title="No fee records found"
          description="Fee records appear here once invoices are generated."
          action={
            <Link href="/invoices/new">
              <Button variant="success">Generate an invoice</Button>
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <Table>
            <THead>
              <TR>
                <TH>Student</TH>
                <TH>Invoice</TH>
                <TH>Fee Type</TH>
                <TH>Academic Year</TH>
                <TH className="text-right">Amount</TH>
                <TH className="text-right">Paid</TH>
                <TH className="text-right">Balance</TH>
                <TH>Status</TH>
                <TH>Date</TH>
              </TR>
            </THead>
            <TBody>
              {fees.map((f) => (
                <TR key={f.id}>
                  <TD>
                    <Link href={`/students/${f.invoice?.student?.id}`} className="font-medium text-slate-900 hover:text-indigo-600">
                      {f.invoice?.student?.student_name}
                    </Link>
                  </TD>
                  <TD>
                    <Link href={`/invoices/${f.invoice?.id}`} className="font-semibold text-indigo-600 hover:text-indigo-700">
                      {f.invoice?.invoice_number}
                    </Link>
                  </TD>
                  <TD>
                    <p className="font-medium text-slate-900">{f.fee_type}</p>
                    {f.description && <p className="text-xs text-slate-400">{f.description}</p>}
                  </TD>
                  <TD>{f.invoice?.academic_year}</TD>
                  <TD className="text-right font-medium">{formatCurrency(Number(f.amount), currency)}</TD>
                  <TD className="text-right text-emerald-600">
                    {formatCurrency(Number(f.invoice?.amount_paid), currency)}
                  </TD>
                  <TD className="text-right">
                    {Number(f.invoice?.balance) > 0 ? (
                      <span className="font-medium text-rose-600">
                        {formatCurrency(Number(f.invoice?.balance), currency)}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </TD>
                  <TD>
                    <StatusBadge status={f.invoice?.status ?? "pending"} />
                  </TD>
                  <TD>{formatDate(f.invoice?.invoice_date)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <div className="border-t border-slate-100 px-4 py-3 text-right text-sm font-semibold text-slate-700">
            Total fee value shown: {formatCurrency(totalCharged, currency)}
          </div>
        </div>
      )}
    </div>
  );
}