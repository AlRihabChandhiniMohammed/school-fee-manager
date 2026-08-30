"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input, Select } from "@/components/ui/field";
import { ACADEMIC_YEARS } from "@/lib/constants";

export function StudentFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [term, setTerm] = useState(searchParams.get("q") ?? "");
  const [yearFilter, setYearFilter] = useState(searchParams.get("year") ?? "");

  useEffect(() => {
    const timer = setTimeout(() => {
      updateQuery({ q: term });
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  function updateQuery(changes: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    updateQuery({ q: term });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mb-5 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3"
    >
      <div className="relative sm:col-span-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search by name, parent name or phone…"
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

      <Select
        value={yearFilter}
        onChange={(e) => {
          setYearFilter(e.target.value);
          updateQuery({ year: e.target.value });
        }}
      >
        <option value="">All academic years</option>
        {ACADEMIC_YEARS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Select>
    </form>
  );
}