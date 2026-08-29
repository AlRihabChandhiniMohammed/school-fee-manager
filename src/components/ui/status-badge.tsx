import { CheckCircle2, Clock, AlertTriangle, MinusCircle } from "lucide-react";
import { cn, statusLabel } from "@/lib/utils";

const styles: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  partial: "bg-amber-50 text-amber-700 ring-amber-600/20",
  pending: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

const icons: Record<string, typeof CheckCircle2> = {
  paid: CheckCircle2,
  partial: AlertTriangle,
  pending: Clock,
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const Icon = icons[status] ?? MinusCircle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        styles[status] ?? styles.pending,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {statusLabel(status)}
    </span>
  );
}

export function StatusDot({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        status === "paid" && "bg-emerald-500",
        status === "partial" && "bg-amber-500",
        status === "pending" && "bg-rose-500"
      )}
    />
  );
}