"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/field";

const SUGGESTIONS = ["Parent name", "Mobile number", "Student name", "Student ID"];

export function SearchBox({ defaultQuery }: { defaultQuery: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [term, setTerm] = useState(defaultQuery);

  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      if (term.trim()) next.set("q", term.trim());
      else next.delete("q");
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(searchParams.toString());
    if (term.trim()) next.set("q", term.trim());
    else next.delete("q");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search by parent name, mobile number, student name or student ID…"
          className="py-3 pl-11 text-base"
          autoFocus
        />
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span>Try searching:</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setTerm(s.toLowerCase().includes("mobile") ? "9876543210" : s.toLowerCase().split(" ")[0])}
            className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600"
          >
            {s}
          </button>
        ))}
      </div>
    </form>
  );
}