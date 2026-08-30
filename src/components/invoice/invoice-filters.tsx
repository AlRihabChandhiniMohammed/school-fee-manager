"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input, Select } from "@/components/ui/field";
import { ACADEMIC_YEARS, PAYMENT_METHODS, PAYMENT_STATUSES } from "@/lib/constants";
import { statusLabel } from "@/lib/utils";

function useQueryUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (changes: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };
}

export function InvoiceFilters() {
  const searchParams = useSearchParams();
  const updateQuery = useQueryUpdater();

  const [term, setTerm] = useState(searchParams.get("q") ?? "");
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");
  const [yearFilter, setYearFilter] = useState(searchParams.get("year") ?? "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");
  const [methodFilter, setMethodFilter] = useState(searchParams.get("method") ?? "");

  useEffect(() => {
    const timer = setTimeout(() => {
      updateQuery({ q: term });
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    updateQuery({ q: term });
  }

  return (
    <form onSubmit={onSubmit} className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search by invoice no, student, parent name or phone…"
            className="pl-9"
          />
          {term && (
            <button
              type="button"
              onClick={() => {
                setTerm("");
                updateQuery({ q: "" });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">From</label>
            <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); updateQuery({ from: e.target.value }); }} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">To</label>
            <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); updateQuery({ to: e.target.value }); }} />
          </div>
        </div>
        <Select value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); updateQuery({ year: e.target.value }); }}>
          <option value="">All academic years</option>
          {ACADEMIC_YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); updateQuery({ status: e.target.value }); }}>
          <option value="">All statuses</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </Select>
        <Select value={methodFilter} onChange={(e) => { setMethodFilter(e.target.value); updateQuery({ method: e.target.value }); }}>
          <option value="">All payment methods</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>Filters update automatically as you search.</span>
        {(searchParams.get("q") || searchParams.get("from") || searchParams.get("to") || searchParams.get("year") || searchParams.get("status") || searchParams.get("method")) && (
          <button
            type="button"
            className="font-medium text-indigo-600 hover:text-indigo-700"
            onClick={() => {
              setTerm(""); setFrom(""); setTo(""); setYearFilter(""); setStatusFilter(""); setMethodFilter("");
              updateQuery({ q: "", from: "", to: "", year: "", status: "", method: "" });
            }}
          >
            Clear all filters
          </button>
        )}
      </div>
    </form>
  );
}