import { CalendarDays, CalendarRange, Clock, TrendingUp, CheckCircle2, AlertTriangle, Banknote } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui/page-header";
import { ReportsFilters } from "@/components/reports/reports-filters";
import { CollectionCharts, ExportCsv, type MonthlyPoint } from "@/components/reports/reports-client";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { ReportRow, ReportRowInput } from "@/lib/types";
import { formatCurrency, monthShortKey, monthLabel } from "@/lib/format";
import { round2 } from "@/lib/utils";

export const metadata = { title: "Reports" };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; class?: string; year?: string; method?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const settings = await getSettings();
  const currency = settings.currency;

  let query = supabase
    .from("invoices")
    .select(
      "id, invoice_number, invoice_date, academic_year, subtotal, discount, total_amount, amount_paid, balance, status, payment_method, student:students(student_id, student_name, parent_name, parent_phone, class, section)"
    );

  if (sp.from) query = query.gte("invoice_date", sp.from);
  if (sp.to) query = query.lte("invoice_date", sp.to);
  if (sp.class) query = query.eq("student.class", sp.class);
  if (sp.year) query = query.eq("academic_year", sp.year);
  if (sp.method) query = query.eq("payment_method", sp.method);

  const { data } = await query
    .order("invoice_date", { ascending: true })
    .returns<ReportRowInput[]>();

  const rows: ReportRow[] = (data ?? []).map((inv) => ({
    invoice_number: inv.invoice_number,
    invoice_id: inv.id,
    student_id: inv.student?.student_id ?? "",
    student_name: inv.student?.student_name ?? "",
    parent_name: inv.student?.parent_name ?? "",
    parent_phone: inv.student?.parent_phone ?? "",
    class: inv.student?.class ?? "",
    section: inv.student?.section ?? "",
    academic_year: inv.academic_year,
    invoice_date: inv.invoice_date,
    payment_method: inv.payment_method,
    subtotal: Number(inv.subtotal),
    discount: Number(inv.discount),
    total_amount: Number(inv.total_amount),
    amount_paid: Number(inv.amount_paid),
    balance: Number(inv.balance),
    status: inv.status,
  }));

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const monthKey = monthShortKey(todayISOString());

  const collectedDaily = round2(
    rows.filter((r) => r.invoice_date === todayKey).reduce((s, r) => s + r.amount_paid, 0)
  );
  const collectedMonthly = round2(
    rows.filter((r) => monthShortKey(r.invoice_date) === monthKey).reduce((s, r) => s + r.amount_paid, 0)
  );
  const collectedYearly = round2(
    rows.filter((r) => r.invoice_date.startsWith(String(today.getFullYear()))).reduce((s, r) => s + r.amount_paid, 0)
  );
  const totalCollected = round2(rows.reduce((s, r) => s + r.amount_paid, 0));
  const totalPending = round2(rows.reduce((s, r) => s + r.balance, 0));

  const paidCount = rows.filter((r) => r.status === "paid").length;
  const partialCount = rows.filter((r) => r.status === "partial").length;
  const pendingCount = rows.filter((r) => r.status === "pending").length;

  // Monthly chart data (last 6 months)
  const range: MonthlyPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const amount = round2(
      rows.filter((r) => monthShortKey(r.invoice_date) === key).reduce((s, r) => s + r.amount_paid, 0)
    );
    range.push({ key, label: monthLabel(key), amount });
  }

  const statusData = [
    { name: "Paid", value: paidCount, color: "#10b981" },
    { name: "Partially Paid", value: partialCount, color: "#f59e0b" },
    { name: "Pending", value: pendingCount, color: "#f43f5e" },
  ].filter((s) => s.value > 0);

  const active =
    Boolean(sp.from) || Boolean(sp.to) || Boolean(sp.class) || Boolean(sp.year) || Boolean(sp.method);

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Fee collection reports and analytics."
        actions={<ExportCsv rows={rows} filename={`payment_records_${new Date().toISOString().slice(0, 10)}.csv`} />}
      />

      <ReportsFilters />

      {rows.length === 0 && !active ? (
        <EmptyState
          title="No data yet"
          description="Once you generate invoices, reports and charts will appear here."
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Collected (filtered)" value={formatCurrency(totalCollected, currency)} icon={TrendingUp} tone="emerald" />
            <StatCard label="Total Pending Fees" value={formatCurrency(totalPending, currency)} icon={Clock} tone="amber" />
            <StatCard label="Collected Today" value={formatCurrency(collectedDaily, currency)} icon={CalendarDays} tone="sky" />
            <StatCard label="Collected This Month" value={formatCurrency(collectedMonthly, currency)} icon={CalendarRange} tone="indigo" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Paid Invoices" value={String(paidCount)} icon={CheckCircle2} tone="emerald" />
            <StatCard label="Partially Paid Invoices" value={String(partialCount)} icon={AlertTriangle} tone="amber" />
            <StatCard label="Pending Invoices" value={String(pendingCount)} icon={Banknote} tone="rose" />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Collected This Year</h3>
                <p className="text-xs text-slate-400">{today.getFullYear()} collections</p>
              </div>
              <span className="text-lg font-bold text-slate-900">
                {formatCurrency(collectedYearly, currency)}
              </span>
            </div>
            <CollectionCharts
              monthly={range}
              statusData={statusData.length ? statusData : [{ name: "No data", value: 1, color: "#e2e8f0" }]}
              currency={currency}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function todayISOString(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}