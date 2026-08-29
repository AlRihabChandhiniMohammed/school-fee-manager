"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, ChevronDown } from "lucide-react";
import { signOutAction } from "@/lib/actions";
import { initials } from "@/lib/utils";

export function UserMenu({ email }: { email?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await signOutAction();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2.5 transition hover:bg-slate-100"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
          {initials(email?.split("@")[0] ?? "A")}
        </span>
        <span className="hidden max-w-[160px] truncate text-sm font-medium text-slate-700 md:block">
          {email}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            <div className="border-b border-slate-100 px-4 py-2.5">
              <p className="truncate text-sm font-medium text-slate-900">{email}</p>
              <p className="text-xs text-slate-400">School Administrator</p>
            </div>
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              {loading ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}