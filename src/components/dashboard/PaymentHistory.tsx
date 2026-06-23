"use client";

import { Download, Receipt } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { generateReceipt } from "@/lib/pdfGenerator";
import type { Student } from "@/types/payments";

type PaymentHistoryProps = {
  student: Student;
};

export function PaymentHistory({ student }: PaymentHistoryProps) {
  const paidInstallments = student.installments.filter(
    (installment) => installment.status === "PAGADO",
  );
  const tenantName = "Colegio Conquistadores";

  return (
    <section className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-tenant-secondary">
            Historial de pagos
          </p>
          <h1 className="mt-2 text-3xl font-black text-tenant-primary">
            {student.name}
          </h1>
        </div>
        <p className="text-sm text-slate-500">
          {paidInstallments.length} pago(s) registrado(s)
        </p>
      </div>

      {paidInstallments.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-[8px] border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-[8px] bg-white text-slate-400 shadow-sm">
            <Receipt className="h-8 w-8" aria-hidden />
          </div>
          <p className="mt-4 max-w-sm text-sm font-semibold leading-6 text-slate-500">
            Aún no tienes registros de pagos históricos.
          </p>
        </div>
      ) : (
      <div className="mt-6 overflow-x-auto rounded-[8px] border border-slate-200">
        <div className="hidden min-w-[780px] grid-cols-[150px_1fr_140px_160px_160px] bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-slate-500 md:grid">
          <span>Fecha</span>
          <span>Concepto</span>
          <span>Monto</span>
          <span>Orden</span>
          <span>Acción</span>
        </div>

        {paidInstallments.map((installment) => (
          <div
            key={installment.id}
            className="grid gap-3 border-t border-slate-100 px-4 py-4 first:border-t-0 md:min-w-[780px] md:grid-cols-[150px_1fr_140px_160px_160px] md:items-center"
          >
            <span className="text-sm font-semibold text-slate-700">
              <span className="mr-2 font-bold uppercase tracking-[0.1em] text-slate-400 md:hidden">
                Fecha
              </span>
              {formatDate(installment.paidAt ?? installment.dueDate)}
            </span>
            <span className="font-bold text-slate-950">
              <span className="mr-2 text-xs uppercase tracking-[0.1em] text-slate-400 md:hidden">
                Concepto
              </span>
              Mensualidad {installment.month}
            </span>
            <span className="font-black text-slate-950">
              <span className="mr-2 text-xs uppercase tracking-[0.1em] text-slate-400 md:hidden">
                Monto
              </span>
              {formatCurrency(installment.amount)}
            </span>
            <span className="text-sm text-slate-500">
              <span className="mr-2 font-bold uppercase tracking-[0.1em] text-slate-400 md:hidden">
                Orden
              </span>
              {installment.purchaseOrder ?? "OC-DEMO"}
            </span>
            <button
              type="button"
              onClick={() =>
                generateReceipt(
                  installment.purchaseOrder ?? installment.id,
                  installment.amount,
                  installment.paidAt ?? installment.dueDate,
                  student.name,
                  tenantName,
                )
              }
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[8px] border border-tenant-primary/30 bg-white px-3 text-sm font-bold text-tenant-primary transition hover:bg-tenant-primary hover:text-white md:h-10"
            >
              <Download className="h-4 w-4" aria-hidden />
              Descargar PDF
            </button>
          </div>
        ))}

      </div>
      )}
    </section>
  );
}
