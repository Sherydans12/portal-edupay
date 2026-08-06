"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  Download,
  Printer,
  ReceiptText,
  WalletCards,
  X,
} from "lucide-react";
import { InstitutionalDocumentHeader } from "@/components/documents/InstitutionalDocumentHeader";
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
  const totalPaid = paidInstallments.reduce(
    (total, installment) => total + installment.amount,
    0,
  );
  const latestPayment = paidInstallments.reduce<Installment | null>(
    (latest, installment) => {
      if (!latest) {
        return installment;
      }

      const currentDate = new Date(
        installment.paidAt ?? installment.dueDate,
      ).getTime();
      const latestDate = new Date(latest.paidAt ?? latest.dueDate).getTime();
      return currentDate > latestDate ? installment : latest;
    },
    null,
  );

  return (
    <section>
      <header>
        <h1 className="text-3xl font-black tracking-[-0.03em] text-tenant-primary sm:text-4xl">
          Historial de pagos
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          Consulta los pagos de {student.name}, revisa su respaldo y descarga
          cada comprobante institucional.
        </p>
      </header>

      <div
        className="mt-6 grid overflow-hidden rounded-[14px] border border-slate-200 bg-white sm:grid-cols-3"
        aria-label="Resumen de pagos"
      >
        <HistorySummary
          icon={ReceiptText}
          label="Pagos registrados"
          value={`${paidInstallments.length}`}
        />
        <HistorySummary
          icon={WalletCards}
          label="Total documentado"
          value={formatCurrency(totalPaid)}
          emphasis
        />
        <HistorySummary
          icon={CalendarCheck2}
          label="Último pago"
          value={
            latestPayment
              ? formatDate(latestPayment.paidAt ?? latestPayment.dueDate)
              : "Sin registros"
          }
          compact
        />
      </div>

      {paidInstallments.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-[14px] border border-dashed border-slate-300 bg-white px-4 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-tenant-primary/8 text-tenant-primary">
            <ReceiptText className="h-7 w-7" aria-hidden />
          </div>
          <p className="mt-4 max-w-sm text-base font-black leading-6 text-tenant-primary">
            Aún no hay comprobantes emitidos
          </p>
          <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
            Los pagos aprobados aparecerán aquí con su respaldo descargable.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-[14px] border border-slate-200 bg-white">
          <div className="flex flex-col gap-2 border-b border-slate-200 bg-[#fbfcff] px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-tenant-primary">
                Comprobantes emitidos
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Respaldo cronológico de los pagos aprobados.
              </p>
            </div>
            <span className="text-sm font-bold text-slate-500">
              {paidInstallments.length}{" "}
              {paidInstallments.length === 1 ? "documento" : "documentos"}
            </span>
          </div>

          <div className="hidden min-w-[800px] grid-cols-[150px_1fr_130px_170px_180px] border-b border-slate-100 px-5 py-3 text-xs font-bold uppercase tracking-[0.1em] text-slate-500 md:grid">
            <span>Fecha</span>
            <span>Concepto</span>
            <span>Monto</span>
            <span>Orden</span>
            <span />
          </div>

          {paidInstallments.map((installment) => (
            <div
              key={installment.id}
              className="grid gap-4 border-t border-slate-100 px-5 py-5 first:border-t-0 md:min-w-[800px] md:grid-cols-[150px_1fr_130px_170px_180px] md:items-center"
            >
              <span className="text-sm font-semibold text-slate-700">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-slate-400 md:hidden">
                  Fecha
                </span>
                {formatDate(installment.paidAt ?? installment.dueDate)}
              </span>
              <span>
                <span className="block font-black text-slate-950">
                  Mensualidad {installment.month}
                </span>
                <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  Pago registrado
                </span>
              </span>
              <span className="font-black text-slate-950">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-slate-400 md:hidden">
                  Monto
                </span>
                {formatCurrency(installment.amount)}
              </span>
              <span className="break-all text-sm font-semibold text-slate-500">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-slate-400 md:hidden">
                  Orden
                </span>
                {installment.purchaseOrder ?? "OC-DEMO"}
              </span>
              <button
                type="button"
                onClick={() => setSelectedInstallment(installment)}
                className="flex h-11 w-full items-center justify-between gap-2 whitespace-nowrap rounded-[8px] border border-tenant-primary/20 bg-white px-4 text-sm font-black text-tenant-primary transition hover:border-tenant-primary hover:bg-tenant-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tenant-primary md:h-10"
              >
                Ver comprobante
                <ChevronRight className="h-4 w-4" aria-hidden />
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
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "America/Santiago",
});

function PaymentReceiptModal({
  installment,
  studentName,
  onClose,
}: PaymentReceiptModalProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
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
        <section className="voucher-receipt w-full overflow-hidden rounded-[14px] bg-white shadow-2xl shadow-slate-950/15">
          <InstitutionalDocumentHeader
            documentType="Comprobante de pago"
            reference={buyOrder}
            action={
              <button
                type="button"
                onClick={onClose}
                className="print-hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border border-slate-200 bg-white text-slate-500 transition hover:border-tenant-primary/30 hover:text-tenant-primary"
                aria-label="Cerrar comprobante"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            }
          />

          <div className="voucher-content px-6 py-7 sm:px-8">
            <div className="flex items-start gap-3 rounded-[12px] border border-emerald-200 bg-emerald-50 px-4 py-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden />
              <div>
                <h2 id="history-receipt-title" className="font-black text-emerald-950">
                  Pago aprobado
                </h2>
                <p className="mt-1 text-sm leading-6 text-emerald-900/75">
                  Transbank autorizó la operación. Conserva este documento como
                  respaldo institucional de tu pago.
                </p>
              </div>
            </div>

            <dl className="mt-7 grid divide-y divide-dashed divide-slate-200 border-y border-dashed border-slate-300 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <div className="sm:pr-6">
                <ReceiptRow label="Fecha y hora" value={receiptDateFormatter.format(new Date(paymentDate))} />
                <ReceiptRow label="Medio de pago" value="Webpay Plus" />
                <ReceiptRow label="Últimos 4 dígitos" value="No disponible" />
              </div>
              <div className="sm:pl-6">
                <ReceiptRow label="Orden de compra" value={buyOrder} />
                <ReceiptRow label="Código de autorización" value={installment.authorizationCode ?? "No disponible"} />
                <ReceiptRow label="Cuotas de la tarjeta" value="No disponible" />
              </div>
            </dl>

            <section className="mt-7" aria-labelledby="history-receipt-details-title">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h3 id="history-receipt-details-title" className="text-lg font-black text-tenant-primary">Detalle del pago</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Cuotas incluidas en esta operación.
                  </p>
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

            <div className="mt-6 flex items-end justify-between gap-4 rounded-[12px] bg-[#f4f6fb] p-5">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Monto total</span>
              <span className="text-2xl font-black text-tenant-primary sm:text-3xl">{formatCurrency(installment.amount)}</span>
            </div>

            <div className="print-hidden mt-7 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-[8px] border border-tenant-primary/25 bg-white px-4 text-sm font-bold text-tenant-primary transition hover:border-tenant-primary hover:bg-tenant-primary/5"
              >
                <Printer className="h-5 w-5" aria-hidden />
                Imprimir / Guardar Comprobante
              </button>
              <button
                type="button"
                onClick={() =>
                  void generateReceipt(
                    installment.amount,
                    buyOrder,
                    installment.authorizationCode ?? null,
                    paymentDate,
                    true,
                    {
                      items: [
                        {
                          studentName,
                          concept: "Mensualidad escolar",
                          month: installment.month,
                          amount: installment.amount,
                        },
                      ],
                    },
                  )
                }
                className="flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-tenant-primary px-4 text-sm font-bold text-white transition hover:bg-tenant-primary/90"
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

function HistorySummary({
  icon: Icon,
  label,
  value,
  emphasis = false,
  compact = false,
}: {
  icon: typeof ReceiptText;
  label: string;
  value: string;
  emphasis?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 border-t border-slate-200 p-5 first:border-t-0 sm:border-l sm:border-t-0 sm:first:border-l-0 ${
        emphasis ? "bg-[#fffaf0]" : "bg-white"
      }`}
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
          emphasis
            ? "bg-tenant-secondary/20 text-[#9b6500]"
            : "bg-tenant-primary/8 text-tenant-primary"
        }`}
      >
        <Icon className="h-4.5 w-4.5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-500">{label}</p>
        <p
          className={`mt-1 truncate font-black ${
            compact ? "text-sm text-tenant-primary" : "text-xl text-tenant-primary"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="m-0 break-words text-sm font-bold text-slate-950 sm:text-right">{value}</dd>
    </div>
  );
}
