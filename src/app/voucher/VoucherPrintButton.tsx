"use client";

import { Printer } from "lucide-react";

export function VoucherPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-tenant-primary/25 bg-white px-4 text-sm font-bold text-tenant-primary transition hover:border-tenant-primary hover:bg-tenant-primary/5"
    >
      <Printer className="h-5 w-5" aria-hidden />
      Imprimir / Guardar Comprobante
    </button>
  );
}
