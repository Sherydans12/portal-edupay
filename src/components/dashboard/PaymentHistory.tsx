"use client";

import { Download, Receipt } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Printer, ReceiptText, X } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { generateReceipt } from "@/lib/pdfGenerator";
import type { Installment, Student } from "@/types/payments";

type PaymentHistoryProps = {
  student: Student;
};

export function PaymentHistory({ student }: PaymentHistoryProps) {
  const [selectedInstallment, setSelectedInstallment] =
    useState<Installment | null>(null);
  const paidInstallments = student.installments.filter(
    (installment) => installment.status === "PAGADO",
  );
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
            A£n no tienes registros de pagos hist¢ricos.
          </p>
        </div>
      ) : (
      <div className="mt-6 overflow-x-auto rounded-[8px] border border-slate-200">
        <div className="hidden min-w-[780px] grid-cols-[150px_1fr_140px_160px_160px] bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-slate-500 md:grid">
          <span>Fecha</span>
          <span>Concepto</span>
          <span>Monto</span>
          <span>Orden</span>
          <span>Acci¢n</span>
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
              onClick={() => setSelectedInstallment(installment)}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[8px] border border-tenant-primary/30 bg-white px-3 text-sm font-bold text-tenant-primary transition hover:bg-tenant-primary hover:text-white md:h-10"
            >
              <ReceiptText className="h-4 w-4" aria-hidden />
              Ver / Descargar Comprobante
            </button>
          </div>
        ))}

      </div>
      )}
      {selectedInstallment && (
        <PaymentReceiptModal
          installment={selectedInstallment}
          studentName={student.name}
          onClose={() => setSelectedInstallment(null)}
        />
      )}
    </section>
  );
}
type PaymentReceiptModalProps = {
  installment: Installment;
  studentName: string;
  onClose: () => void;
};

const receiptDateFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Santiago",
});

function PaymentReceiptModal({
  installment,
  studentName,
  onClose,
}: PaymentReceiptModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const paymentDate = installment.paidAt ?? installment.dueDate;
  const buyOrder = installment.purchaseOrder ?? String(installment.id);

  return createPortal(
    <div
      className="history-receipt-modal fixed inset-0 z-[60] overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-receipt-title"
      onClick={onClose}
    >
      <main
        className="voucher-page mx-auto flex min-h-full w-full max-w-3xl items-center justify-center text-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
        <section className="voucher-receipt w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
          <header className="bg-emerald-700 px-6 py-7 text-white sm:px-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <ReceiptText className="h-8 w-8" aria-hidden />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">
                    Comprobante Webpay Plus
                  </p>
                  <h2 id="history-receipt-title" className="mt-1 text-2xl font-black sm:text-3xl">
                    Pago aprobado
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="print-hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Cerrar comprobante"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </header>

          <div className="voucher-content px-6 py-7 sm:px-8">
            <p className="text-sm leading-6 text-slate-600">
              Transbank autoriz¢ la operaci¢n. Conserva este comprobante como respaldo de tu pago.
            </p>

            <dl className="mt-7 grid divide-y divide-dashed divide-slate-200 border-y border-dashed border-slate-300 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <div className="sm:pr-6">
                <ReceiptRow label="Fecha y hora" value={receiptDateFormatter.format(new Date(paymentDate))} />
                <ReceiptRow label="Medio de pago" value="Webpay Plus" />
                <ReceiptRow label="éltimos 4 d¡gitos" value="No disponible" />
              </div>
              <div className="sm:pl-6">
                <ReceiptRow label="Orden de compra" value={buyOrder} />
                <ReceiptRow label="C¢digo de autorizaci¢n" value={installment.authorizationCode ?? "No disponible"} />
                <ReceiptRow label="Cuotas de la tarjeta" value="No disponible" />
              </div>
            </dl>

            <section className="mt-7" aria-labelledby="history-receipt-details-title">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Detalle del pago</p>
                  <h3 id="history-receipt-details-title" className="mt-1 text-lg font-black text-slate-950">Cuotas pagadas</h3>
                </div>
                <span className="text-sm font-semibold text-slate-500">1 cuota</span>
              </div>

              <div className="voucher-table-wrapper mt-4 overflow-x-auto rounded-xl border border-slate-200">
                <table className="voucher-items-table w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead className="bg-slate-100 text-xs uppercase tracking-[0.1em] text-slate-500">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-bold">Alumno</th>
                      <th scope="col" className="px-4 py-3 font-bold">Concepto</th>
                      <th scope="col" className="px-4 py-3 font-bold">Mes</th>
                      <th scope="col" className="px-4 py-3 text-right font-bold">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-900">{studentName}</td>
                      <td className="px-4 py-3 text-slate-600">Mensualidad escolar</td>
                      <td className="px-4 py-3 text-slate-600">{installment.month}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(installment.amount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <div className="mt-6 flex items-end justify-between gap-4 rounded-xl bg-slate-100 p-5">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Monto total</span>
              <span className="text-2xl font-black text-slate-950 sm:text-3xl">{formatCurrency(installment.amount)}</span>
            </div>

            <div className="print-hidden mt-7 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-tenant-primary/25 bg-white px-4 text-sm font-bold text-tenant-primary transition hover:border-tenant-primary hover:bg-tenant-primary/5"
              >
                <Printer className="h-5 w-5" aria-hidden />
                Imprimir / Guardar Comprobante
              </button>
              <button
                type="button"
                onClick={() => generateReceipt(installment.amount, buyOrder, installment.authorizationCode ?? null, paymentDate, true)}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-tenant-primary/25 bg-white px-4 text-sm font-bold text-tenant-primary transition hover:border-tenant-primary hover:bg-tenant-primary/5"
              >
                <Download className="h-5 w-5" aria-hidden />
                Descargar PDF
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>,
    document.body,
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="m-0 break-all text-sm font-bold text-slate-950 sm:text-right">{value}</dd>
    </div>
  );
}
