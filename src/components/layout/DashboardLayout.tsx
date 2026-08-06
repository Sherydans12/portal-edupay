"use client";

import {
  CalendarDays,
  FileText,
  History,
  LogOut,
  ReceiptText,
  UserRound,
} from "lucide-react";
import { ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import type { Guardian } from "@/types/payments";
import type { ActiveSection } from "@/types/portal";

type DashboardLayoutProps = {
  guardian: Guardian;
  activeSection: ActiveSection;
  children: ReactNode;
  onSectionChange: (section: ActiveSection) => void;
  onLogout: () => void;
};

const sectionItems = [
  {
    key: "account",
    label: "Estado de Cuenta",
    compactLabel: "Estado",
    icon: ReceiptText,
  },
  {
    key: "history",
    label: "Historial de Pagos",
    compactLabel: "Historial",
    icon: History,
  },
  {
    key: "certificates",
    label: "Certificados",
    compactLabel: "Certificados",
    icon: FileText,
  },
  {
    key: "profile",
    label: "Mi cuenta",
    compactLabel: "Mi cuenta",
    icon: UserRound,
  },
] satisfies {
  key: ActiveSection;
  label: string;
  compactLabel: string;
  icon: typeof ReceiptText;
}[];

export function DashboardLayout({
  guardian,
  activeSection,
  children,
  onSectionChange,
  onLogout,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f8f9fb] text-slate-900">
      <aside
        data-global-navigation
        className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200/80 bg-white px-6 py-7 lg:block"
      >
        <BrandLogo />
        <SectionNav
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          className="mt-12"
        />
        <div className="absolute bottom-7 left-6 right-6 border-t border-slate-200 pt-5">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            Apoderado
          </p>
          <p className="mt-1.5 text-sm font-black text-tenant-primary">
            {guardian.name}
          </p>
          <p className="mt-0.5 text-sm text-slate-500">{guardian.rut}</p>
        </div>
      </aside>

      <header
        data-global-navigation
        className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 px-4 py-3.5 backdrop-blur lg:ml-72 lg:px-10"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="lg:hidden">
            <BrandLogo compact />
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-bold text-tenant-primary">Hola, {guardian.name.split(" ")[0]}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <CalendarDays className="h-3.5 w-3.5 text-tenant-secondary" aria-hidden />
              Gestión de pagos familiares
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-black text-slate-700 transition hover:border-tenant-primary/30 hover:text-tenant-primary"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Salir
          </button>
        </div>
      </header>

      <main className="px-3 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5 sm:px-4 lg:ml-72 lg:px-10 lg:py-9">
        {children}
      </main>

      <SectionNav
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 gap-1 border-t border-slate-200 bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_34px_rgba(20,34,76,0.08)] backdrop-blur lg:hidden"
        compact
      />
    </div>
  );
}

function SectionNav({
  activeSection,
  compact = false,
  className = "",
  onSectionChange,
}: {
  activeSection: ActiveSection;
  compact?: boolean;
  className?: string;
  onSectionChange: (section: ActiveSection) => void;
}) {
  return (
    <nav
      data-global-navigation
      className={`${className} ${compact ? "" : "space-y-2"}`}
    >
      {sectionItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.key;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSectionChange(item.key)}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-3 rounded-[8px] px-3 py-3 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-tenant-primary/10 focus:ring-offset-1 ${
              compact
                ? "min-w-0 flex-col justify-center gap-1 px-2 py-2 text-[11px] leading-tight"
                : "w-full"
            } ${
              isActive
                ? "bg-tenant-primary text-white shadow-sm shadow-tenant-primary/20"
                : "text-slate-600 hover:bg-tenant-primary/8 hover:text-tenant-primary"
            }`}
          >
            <Icon className={compact ? "h-5 w-5" : "h-5 w-5"} aria-hidden />
            <span className={compact ? "line-clamp-2 text-center" : ""}>
              {compact ? item.compactLabel : item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
