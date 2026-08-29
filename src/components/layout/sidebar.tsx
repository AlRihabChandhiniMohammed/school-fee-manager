"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wallet,
  FilePlus2,
  FileText,
  BarChart3,
  Settings,
  Search,
  GraduationCap,
  BookOpen,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/students", label: "Students", icon: Users },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/fees", label: "Fees", icon: Wallet },
  { href: "/invoices/new", label: "Generate Invoice", icon: FilePlus2 },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/search", label: "Parent Search", icon: Search },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {NAV_ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <Icon className={cn("h-[18px] w-[18px]", active && "text-indigo-600")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Logo({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className="flex items-center gap-2.5 px-5 py-5"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
        <GraduationCap className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold text-slate-900">School Fees</p>
        <p className="text-xs text-slate-400">Invoice Manager</p>
      </div>
    </Link>
  );
}

export function SidebarNav() {
  return (
    <>
      <Logo />
      <NavLinks />
      <div className="border-t border-slate-100 px-5 py-4">
        <p className="text-[11px] leading-4 text-slate-400">
          Keep all fee records safe and simple.
        </p>
      </div>
    </>
  );
}

export function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className={cn("fixed inset-0 z-50 lg:hidden", !open && "pointer-events-none")}>
      <div
        className={cn(
          "absolute inset-0 bg-slate-900/50 transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={cn(
          "absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-2xl transition-transform",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between pr-3">
          <div className="flex-1">
            <Logo onNavigate={onClose} />
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <NavLinks onNavigate={onClose} />
      </aside>
    </div>
  );
}