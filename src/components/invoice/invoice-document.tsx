import type { SchoolSettings } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn, statusLabel } from "@/lib/utils";

export interface InvoiceDocumentData {
  invoice: {
    invoice_number: string;
    invoice_date: string;
    academic_year: string;
    status: string;
    notes: string | null;
    subtotal: number;
    discount: number;
    total_amount: number;
    amount_paid: number;
    balance: number;
    payment_method: string | null;
  };
  student: {
    student_name: string;
    parent_name: string;
    parent_phone: string;
    parent_email: string | null;
    address: string | null;
  };
  items: { fee_type: string; description: string | null; amount: number }[];
  settings: SchoolSettings;
  showPaymentLabel?: boolean;
}

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-1.5 text-sm",
        strong ? "font-semibold text-slate-900" : "text-slate-600"
      )}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function InvoiceDocument({
  invoice,
  student,
  items,
  settings,
}: InvoiceDocumentData) {
  const symbol = settings.currency === "INR" ? "₹" : settings.currency;
  const cur = (n: number) => formatCurrency(n, settings.currency);
  const logo = settings.school_logo || "/logo.png";

  return (
    <div className="mx-auto w-full max-w-[800px] rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Pumping header */}
      <div className="flex flex-col gap-6 border-b-4 border-indigo-600 px-8 py-7 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg ring-1 ring-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo}
              alt={`${settings.school_name} logo`}
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
              {settings.school_name || "My School"}
            </h1>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {settings.school_address}
              {settings.school_address && <br />}
              {[settings.school_phone, settings.school_email]
                .filter(Boolean)
                .join(" • ")}
              {settings.school_phone && settings.school_email && <br />}
              {settings.school_website}
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-3xl font-extrabold tracking-tight text-indigo-600">INVOICE</p>
          <div className="mt-2 space-y-0.5 text-sm text-slate-600">
            <p><span className="font-medium text-slate-900">Invoice No:</span> {invoice.invoice_number}</p>
            <p><span className="font-medium text-slate-900">Date:</span> {formatDate(invoice.invoice_date)}</p>
            <p><span className="font-medium text-slate-900">Academic Year:</span> {invoice.academic_year}</p>
          </div>
          <span
            className={cn(
              "mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
              invoice.status === "paid" && "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
              invoice.status === "partial" && "bg-amber-50 text-amber-700 ring-amber-600/20",
              invoice.status === "pending" && "bg-rose-50 text-rose-700 ring-rose-600/20"
            )}
          >
            {statusLabel(invoice.status)}
          </span>
        </div>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-1 gap-6 px-8 py-6 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Bill to / Parent</p>
          <p className="text-sm font-semibold text-slate-900">{student.parent_name}</p>
          <p className="mt-0.5 text-sm text-slate-600">Mobile: {student.parent_phone}</p>
          {student.parent_email && (
            <p className="text-sm text-slate-600">{student.parent_email}</p>
          )}
        </div>
        <div className="sm:text-right">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Student</p>
          <p className="text-sm font-semibold text-slate-900">{student.student_name}</p>
        </div>
      </div>

      {/* Items */}
      <div className="px-8">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-indigo-600 text-left text-white">
              <th className="rounded-l-lg px-4 py-2.5 font-medium">#</th>
              <th className="px-4 py-2.5 font-medium">Description</th>
              <th className="rounded-r-lg px-4 py-2.5 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="px-4 py-2.5 text-slate-500">{i + 1}</td>
                <td className="px-4 py-2.5 text-slate-700">
                  {item.fee_type}
                  {item.description && (
                    <span className="block text-xs text-slate-400">{item.description}</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right font-medium text-slate-900">
                  {symbol} {(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  No items
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="flex flex-col-reverse gap-6 px-8 py-6 sm:flex-row sm:justify-between">
        <div className="max-w-[240px] text-xs leading-5 text-slate-400">
          {invoice.notes && (
            <p>
              <span className="font-medium text-slate-500">Notes:</span> {invoice.notes}
            </p>
          )}
          {invoice.payment_method && (
            <p className="mt-1">
              <span className="font-medium text-slate-500">Payment method:</span> {invoice.payment_method}
            </p>
          )}
        </div>
        <div className="w-full sm:w-72 rounded-lg bg-slate-50 px-4 py-3">
          <SummaryRow label="Subtotal" value={cur(invoice.subtotal)} />
          <SummaryRow label="Discount" value={`− ${cur(invoice.discount)}`} />
          <div className="my-1 border-t border-slate-200" />
          <SummaryRow label="Total Amount" value={cur(invoice.total_amount)} strong />
          <SummaryRow label="Amount Paid" value={`− ${cur(invoice.amount_paid)}`} strong />
          <div className="my-1 border-t border-slate-200" />
          <div className="flex items-center justify-between rounded-lg bg-amber-100 px-2.5 py-2 text-sm font-bold text-slate-900">
            <span>Balance Due</span>
            <span>{cur(invoice.balance)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="rounded-b-xl border-t border-slate-200 px-8 py-6">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {settings.invoice_footer || "Thank you for your payment."}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {settings.school_name} {settings.school_phone && `| ${settings.school_phone}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}