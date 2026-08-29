"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input, Select } from "@/components/ui/field";
import { CLASSES, ACADEMIC_YEARS, PAYMENT_STATUSES } from "@/lib/constants";
import { statusLabel } from "@/lib/utils";

export function FeeFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [term, setTerm] = useState(searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");
  const [classFilter, setClassFilter] = useState(searchParams.get("class") ?? "");
  const [yearFilter, setYearFilter] = useState(searchParams.get("year") ?? "");

  function update(params: Record<string, string>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(params)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  useEffect(() => {
    const t = setTimeout(() => update({ q: term }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  return (
    <div className="mb-5 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
      <div className="relative sm:col-span-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search by student, invoice no or fee…"
          className="pl-9"
        />
        {term && (
          <button
            onClick={() => {
              setTerm("");
              update({ q: "" });
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); update({ status: e.target.value }); }}>
        <option value="">All statuses</option>
        {PAYMENT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {statusLabel(s)}
          </option>
        ))}
      </Select>
      <Select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); update({ class: e.target.value }); }}>
        <option value="">All classes</option>
        {CLASSES.map((c) => (
          <option key={c} value={c}>
            Class {c}
          </option>
        ))}
      </Select>
      <Select value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); update({ year: e.target.value }); }}>
        <option value="">All academic years</option>
        {ACADEMIC_YEARS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Select>
    </div>
  );
}