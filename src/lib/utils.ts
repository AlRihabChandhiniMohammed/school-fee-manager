export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function parseNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computeInvoiceTotals(
  items: { amount: number }[],
  discount: number,
  previousDue: number,
  amountPaid: number
) {
  const subtotal = round2(
    items.reduce((sum, item) => sum + parseNumber(item.amount, 0), 0)
  );
  const discountR = round2(Math.max(0, parseNumber(discount, 0)));
  const previousDueR = round2(Math.max(0, parseNumber(previousDue, 0)));
  const total = round2(subtotal - discountR + previousDueR);
  const paid = round2(Math.min(Math.max(0, parseNumber(amountPaid, 0)), total));
  const balance = round2(total - paid);
  return { subtotal, discount: discountR, previousDue: previousDueR, total, paid, balance };
}

export function statusLabel(status: string): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "partial":
      return "Partially Paid";
    default:
      return "Pending";
  }
}

export function initials(name: string): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function truncate(text: string, max: number): string {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}