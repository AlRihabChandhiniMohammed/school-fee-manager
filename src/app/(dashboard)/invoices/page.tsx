import Link from "next/link";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { InvoiceFilters } from "@/components/invoice/invoice-filters";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { InvoiceQuickActions } from "@/components/invoice/invoice-quick-actions";
import { formatCurrency, formatDate } from "@/lib/format";
import type { InvoiceWithStudent } from "@/lib/types";

export const metadata = { title: "Invoices" };

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    from?: string;
    to?: string;
    year?: string;
    status?: string;
    method?: string;
    student?: string;
  }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const settings = await getSettings();
  const currency = settings.currency;

  let query = supabase
    .from("invoices")
    .select(
      "id, invoice_number, invoice_date, academic_year, total_amount, amount_paid, balance, status, payment_method, student:students(id, student_name, parent_name, parent_phone)"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const term = sp.q?.trim();
  if (term) {
    const escaped = term.replace(/'/g, "''");
    query = query.or(
      `invoice_number.ilike.%${escaped}%,student.student_name.ilike.%${escaped}%,student.parent_name.ilike.%${escaped}%,student.parent_phone.ilike.%${escaped}%`
    );
  }
  if (sp.from) query = query.gte("invoice_date", sp.from);
  if (sp.to) query = query.lte("invoice_date", sp.to);
  if (sp.year) query = query.eq("academic_year", sp.year);
  if (sp.status) query = query.eq("status", sp.status);
  if (sp.method) query = query.eq("payment_method", sp.method);
  if (sp.student) query = query.eq("student_id", sp.student);

  const { data: invoices, error } = await query.returns<InvoiceWithStudent[]>();

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Search and manage all invoice records."
        actions={
          <Link href="/invoices/new">
            <Button variant="success">+ Generate Invoice</Button>
          </Link>
        }
      />

      <InvoiceFilters />

      {error ? (
        <EmptyState title="Could not load invoices" description={error.message} />
      ) : !invoices || invoices.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-7 w-7" />}
          title="No invoices found"
          description={
            term || sp.from || sp.to || sp.year || sp.status || sp.method
              ? "Try adjusting your search or filters."
              : "Generate your first invoice to get started."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <Table>
            <THead>
              <TR>
                <TH>Invoice No</TH>
                <TH>Date</TH>
                <TH>Student</TH>
                <TH className="text-right">Amount</TH>
                <TH className="text-right">Paid</TH>
                <TH className="text-right">Balance</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {invoices.map((inv) => (
                <TR key={inv.id}>
                  <TD>
                    <Link href={`/invoices/${inv.id}`} className="font-semibold text-indigo-600 hover:text-indigo-700">
                      {inv.invoice_number}
                    </Link>
                  </TD>
                  <TD>{formatDate(inv.invoice_date)}</TD>
                  <TD>
                    <p className="font-medium text-slate-900">{inv.student?.student_name}</p>
                    <p className="text-xs text-slate-400">{inv.student?.parent_name}</p>
                  </TD>
                  <TD className="text-right font-medium">{formatCurrency(Number(inv.total_amount), currency)}</TD>
                  <TD className="text-right text-emerald-600">{formatCurrency(Number(inv.amount_paid), currency)}</TD>
                  <TD className="text-right">
                    {Number(inv.balance) > 0 ? (
                      <span className="font-medium text-rose-600">{formatCurrency(Number(inv.balance), currency)}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </TD>
                  <TD>
                    <StatusBadge status={inv.status} />
                  </TD>
                  <TD className="text-right">
                    <InvoiceQuickActions
                      invoiceId={inv.id}
                      settings={settings}
                    />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}
    </div>
  );
}