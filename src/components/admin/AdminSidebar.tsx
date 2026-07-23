import { LayoutDashboard, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";

type AdminSection = "dashboard" | "emails";

type AdminSidebarProps = {
  activeSection: AdminSection;
  adminEmail?: string | null;
};

const navigation = [
  {
    href: "/admin",
    label: "Dashboard global",
    section: "dashboard" as const,
    icon: LayoutDashboard,
  },
  {
    href: "/admin/emails",
    label: "Historial de correos",
    section: "emails" as const,
    icon: Mail,
  },
];

export function AdminSidebar({
  activeSection,
  adminEmail,
}: AdminSidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-800 bg-slate-950 px-5 py-6 text-white lg:flex">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-600">
          <ShieldCheck className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="font-black tracking-tight">BaseLogic Ops</p>
          <p className="text-xs text-slate-400">Consola multi-tenant</p>
        </div>
      </div>

      <nav className="mt-10 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = item.section === activeSection;

          return (
            <Link
              key={item.section}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-800 pt-5">
        <p className="px-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Super Admin
        </p>
        <p className="mb-4 mt-2 truncate px-3 text-sm text-slate-300">
          {adminEmail}
        </p>
        <AdminSignOutButton />
      </div>
    </aside>
  );
}
