"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function AdminSignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
    >
      <LogOut className="h-4 w-4" aria-hidden />
      Cerrar sesión
    </button>
  );
}
