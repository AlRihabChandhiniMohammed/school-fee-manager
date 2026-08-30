"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Download } from "lucide-react";
import type { ReportRow } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { currencyPrefix, formatNumber } from "@/lib/format";

export interface MonthlyPoint {
  key: string;
  label: string;
  amount: number;
}

export function CollectionCharts({
  monthly,
  statusData,
  currency,
}: {
  monthly: MonthlyPoint[];
  statusData: { name: string; value: number; color: string }[];
  currency: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
        <h3 className="mb-1 text-sm font-semibold text-slate-900">Monthly Collection</h3>
        <p className="mb-4 text-xs text-slate-400">Fees collected per month in the selected range</p>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  `${currencyPrefix(currency)}${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`
                }
                width={60}
              />
              <Tooltip
                formatter={(value) => [`${currencyPrefix(currency)} ${formatNumber(Number(value))}`, "Collected"]}
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="amount" name="Collected" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold text-slate-900">Payment Status</h3>
        <p className="mb-4 text-xs text-slate-400">Distribution of invoice statuses</p>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                stroke="none"
              >
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [String(value), name]}
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export function ExportCsv({ rows, filename }: { rows: ReportRow[]; filename: string }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  function handleExport() {
    if (rows.length === 0) {
      toast("info", "No records to export");
      return;
    }
    setBusy(true);
    const header = [
      "Invoice No",
      "Date",
      "Student",
      "Parent",
      "Parent Phone",
      "Academic Year",
      "Payment Method",
      "Subtotal",
      "Discount",
      "Total Amount",
      "Amount Paid",
      "Balance",
      "Status",
    ];
    const escape = (v: unknown) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = rows.map((r) =>
      [
        r.invoice_number,
        r.invoice_date,
        r.student_name,
        r.parent_name,
        r.parent_phone,
        r.academic_year,
        r.payment_method ?? "",
        r.subtotal,
        r.discount,
        r.total_amount,
        r.amount_paid,
        r.balance,
        r.status,
      ]
        .map(escape)
        .join(",")
    );
    const csv = [header.map(escape).join(","), ...lines].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setBusy(false);
    toast("success", `Exported ${rows.length} records`);
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={busy}>
      <Download className="h-4 w-4" /> Export CSV
    </Button>
  );
}