"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  LayoutDashboard,
  Users,
  Wallet,
  FilePlus2,
  FileText,
  BarChart3,
  Settings,
  Search,
  BookOpen,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
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
      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
        <Image
          src="/logo.png"
          alt="School Fees"
          width={1536}
          height={1024}
          priority
          className="h-9 w-9 object-contain"
        />
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

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const mounted = useIsClient();

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn("fixed inset-0 z-50 lg:hidden", !open && "pointer-events-none")}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      <div
        className={cn(
          "absolute inset-0 bg-slate-900/60 transition-opacity",
          open ? "opacity-100" : "invisible opacity-0"
        )}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={cn(
          "absolute left-0 top-0 flex h-full w-[272px] max-w-[85vw] flex-col bg-white shadow-2xl transition-transform",
          open ? "visible translate-x-0" : "invisible -translate-x-full"
        )}
      >
        <div className="flex flex-none items-center justify-between pr-3">
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
        <div className="flex-none border-t border-slate-100 px-5 py-4">
          <p className="text-[11px] leading-4 text-slate-400">
            Keep all fee records safe and simple.
          </p>
        </div>
      </aside>
    </div>,
    document.body
  );
}