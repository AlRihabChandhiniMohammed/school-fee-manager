import { CURRENCIES } from "@/lib/constants";

const localeFor = (currency: string) => (currency === "INR" ? "en-IN" : "en-US");

export function currencySymbol(currency: string): string {
  const match = CURRENCIES.find((c) => c.code === currency);
  return match ? match.symbol : currency === "INR" ? "₹" : "";
}

export function currencyPrefix(currency: string): string {
  if (currency === "INR") return "Rs.";
  const match = CURRENCIES.find((c) => c.code === currency);
  return match ? match.symbol : "";
}

export function formatCurrency(
  amount: number,
  currency: string = "INR",
  withSymbol = true
): string {
  const value = Number.isFinite(amount) ? amount : 0;
  try {
    const formatted = new Intl.NumberFormat(localeFor(currency), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
    return withSymbol ? `${currencySymbol(currency)}${formatted}` : formatted;
  } catch {
    return `${value.toFixed(2)}`;
  }
}

export function formatNumber(amount: number): string {
  const value = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return value.toFixed(2);
  }
}

export function formatDate(date?: string | null): string {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date?: string | null): string {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function todayISO(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

export function invoicePdfFilename(
  invoiceNumber: string,
  studentName: string
): string {
  const safeName = (studentName || "Student")
    .trim()
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .replace(/\s+/g, "_");
  return `Invoice_${invoiceNumber}_${safeName}.pdf`;
}

export function monthShortKey(date: string): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string): string {
  const [year, month] = key.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}