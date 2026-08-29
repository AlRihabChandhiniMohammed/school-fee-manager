import {
  Banknote,
  Users,
  Wallet,
  CalendarCheck2,
  FileText,
  Clock3,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { InvoiceQuickActions } from "@/components/invoice/invoice-quick-actions";
import { formatCurrency, formatDate } from "@/lib/format";
import { round2 } from "@/lib/utils";
import type { InvoiceWithStudent } from "@/lib/types";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const settings = await getSettings();
  const currency = settings.currency;

  const [students, invoices, payments] = await Promise.all([
    supabase.from("students").select("id"),
    supabase.from("invoices").select("amount_paid, balance, status, invoice_date, created_at"),
    supabase.from("payments").select("amount, payment_date"),
  ]);

  const totalStudents = students.data?.length ?? 0;
  const totalCollected = round2(
    (invoices.data ?? []).reduce((s, inv) => s + Number(inv.amount_paid), 0)
  );
  const feesPending = round2(
    (invoices.data ?? []).reduce(
      (s, inv) => s + (Number(inv.balance) > 0 ? Number(inv.balance) : 0),
      0
    )
  );

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const collectedThisMonth = round2(
    (payments.data ?? []).reduce((s, p) => {
      const d = new Date(p.payment_date);
      return d >= monthStart ? s + Number(p.amount) : s;
    }, 0)
  );

  const totalInvoices = invoices.data?.length ?? 0;
  const pendingPayments = (invoices.data ?? []).filter(
    (inv) => Number(inv.balance) > 0
  ).length;

  const { data: recent, error: recentError } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, invoice_date, amount_paid, balance, status, student:students(id, student_id, student_name, parent_name, parent_phone, class, section)"
    )
    .order("created_at", { ascending: false })
    .limit(10)
    .returns<InvoiceWithStudent[]>();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of fee collections and recent activity."
        actions={
          <>
            <Link href="/students/new">
              <Button>+ Add Student</Button>
            </Link>
            <Link href="/invoices/new">
              <Button variant="success">+ Generate Invoice</Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Students" value={String(totalStudents)} icon={Users} tone="indigo" />
        <StatCard
          label="Total Fees Collected"
          value={formatCurrency(totalCollected, currency)}
          icon={Banknote}
          tone="emerald"
        />
        <StatCard
          label="Fees Pending"
          value={formatCurrency(feesPending, currency)}
          icon={Wallet}
          tone="amber"
        />
        <StatCard
          label="Collected This Month"
          value={formatCurrency(collectedThisMonth, currency)}
          icon={CalendarCheck2}
          tone="sky"
        />
        <StatCard label="Invoices Issued" value={String(totalInvoices)} icon={FileText} tone="slate" />
        <StatCard
          label="Pending Payments"
          value={String(pendingPayments)}
          icon={Clock3}
          tone="rose"
        />
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Recent Payments</h2>
          <Link href="/invoices" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View all →
          </Link>
        </div>

        {recentError || !recent || recent.length === 0 ? (
          <EmptyState
            title="No payments yet"
            description="Create your first invoice to start tracking fee payments."
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
                  <TH>Invoice No</TH>
                  <TH>Student</TH>
                  <TH>Parent</TH>
                  <TH>Class</TH>
                  <TH>Amount</TH>
                  <TH>Payment Date</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {recent.map((inv) => (
                  <TR key={inv.id}>
                    <TD className="font-semibold text-indigo-600">{inv.invoice_number}</TD>
                    <TD>
                      <p className="font-medium text-slate-900">{inv.student?.student_name}</p>
                      <p className="text-xs text-slate-400">{inv.student?.student_id}</p>
                    </TD>
                    <TD>{inv.student?.parent_name}</TD>
                    <TD>
                      Class {inv.student?.class}
                      {inv.student?.section ? `-${inv.student.section}` : ""}
                    </TD>
                    <TD className="font-medium">{formatCurrency(Number(inv.amount_paid), currency)}</TD>
                    <TD>{formatDate(inv.invoice_date)}</TD>
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
    </div>
  );
}