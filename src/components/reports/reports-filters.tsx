"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input, Select } from "@/components/ui/field";
import { ACADEMIC_YEARS, PAYMENT_METHODS } from "@/lib/constants";

export function ReportsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");
  const [yearFilter, setYearFilter] = useState(searchParams.get("year") ?? "");
  const [methodFilter, setMethodFilter] = useState(searchParams.get("method") ?? "");

  function update(params: Record<string, string>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(params)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">From</label>
          <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); update({ from: e.target.value }); }} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">To</label>
          <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); update({ to: e.target.value }); }} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Academic Year</label>
          <Select value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); update({ year: e.target.value }); }}>
            <option value="">All years</option>
            {ACADEMIC_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Payment Method</label>
          <Select value={methodFilter} onChange={(e) => { setMethodFilter(e.target.value); update({ method: e.target.value }); }}>
            <option value="">All methods</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}