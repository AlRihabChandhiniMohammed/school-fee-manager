"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { MobileSidebar } from "@/components/layout/sidebar";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <MobileSidebar open={open} onClose={() => setOpen(false)} />
    </>
  );
}