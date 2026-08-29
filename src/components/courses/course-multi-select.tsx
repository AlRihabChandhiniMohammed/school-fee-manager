"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Check, BookOpen } from "lucide-react";
import type { Course } from "@/lib/types";

export function CourseMultiSelect({
  courses,
  value,
  onChange,
}: {
  courses: Course[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selected = courses.filter((c) => value.includes(c.id));

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[38px] w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      >
        {selected.length === 0 ? (
          <span className="text-slate-400">Select courses…</span>
        ) : (
          <span className="flex flex-wrap gap-1">
            {selected.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
              >
                {c.name}
              </span>
            ))}
          </span>
        )}
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          {courses.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-slate-500">
              No courses yet.{" "}
              <Link href="/courses" className="font-medium text-indigo-600 hover:text-indigo-700">
                Add courses
              </Link>
            </div>
          ) : (
            <div className="max-h-64 overflow-auto">
              {courses.map((c) => {
                const active = value.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggle(c.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                        active
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {active && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span className="font-medium text-slate-800">{c.name}</span>
                    {c.code && <span className="text-xs text-slate-400">{c.code}</span>}
                  </button>
                );
              })}
            </div>
          )}
          {courses.length > 0 && (
            <div className="mt-2 border-t border-slate-100 pt-2">
              <Link
                href="/courses"
                className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                <BookOpen className="h-3.5 w-3.5" /> Manage courses
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}