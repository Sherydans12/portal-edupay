"use client";

import { FileText, History, LogOut, ReceiptText } from "lucide-react";
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
  { key: "account", label: "Estado de Cuenta", icon: ReceiptText },
  { key: "history", label: "Historial de Pagos", icon: History },
  { key: "certificates", label: "Certificados", icon: FileText },
] satisfies {
  key: ActiveSection;
  label: string;
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white px-6 py-6 lg:block">
        <BrandLogo />
        <SectionNav
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          className="mt-10"
        />
        <div className="absolute bottom-6 left-6 right-6 rounded-[8px] border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Apoderado
          </p>
          <p className="mt-2 text-sm font-bold text-tenant-primary">
            {guardian.name}
          </p>
          <p className="text-sm text-slate-500">{guardian.rut}</p>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:ml-72 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="lg:hidden">
            <BrandLogo compact />
          </div>
          <div className="hidden lg:block">
            <p className="text-sm text-slate-500">Colegio Conquistadores</p>
            <p className="font-bold text-tenant-primary">Portal de pagos</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex h-10 items-center gap-2 rounded-[8px] border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-tenant-primary/30 hover:text-tenant-primary"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Salir
          </button>
        </div>
      </header>

      <main className="px-3 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5 sm:px-4 lg:ml-72 lg:px-8 lg:py-8">
        {children}
      </main>

      <SectionNav
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 gap-1 border-t border-slate-200 bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-2xl shadow-slate-900/10 backdrop-blur lg:hidden"
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
    <nav className={`${className} ${compact ? "" : "space-y-2"}`}>
      {sectionItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.key;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSectionChange(item.key)}
            className={`flex items-center gap-3 rounded-[8px] px-3 py-3 text-sm font-bold transition ${
              compact
                ? "min-w-0 flex-col justify-center gap-1 px-2 py-2 text-[11px] leading-tight"
                : "w-full"
            } ${
              isActive
                ? "bg-tenant-primary text-white"
                : "text-slate-600 hover:bg-tenant-primary/10 hover:text-tenant-primary"
            }`}
          >
            <Icon className={compact ? "h-5 w-5" : "h-5 w-5"} aria-hidden />
            <span className={compact ? "line-clamp-2 text-center" : ""}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
