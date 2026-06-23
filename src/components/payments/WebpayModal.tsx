"use client";

import { CheckCircle2, Loader2, X } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { Student } from "@/types/payments";
import type { PaymentSnapshot, WebpayReceipt } from "@/types/portal";

type WebpayTransactionModalProps = {
  snapshot: PaymentSnapshot;
  isProcessing: boolean;
  onSuccess: () => void;
  onCancel: () => void;
};

type ReceiptModalProps = {
  receipt: WebpayReceipt;
  student: Student;
  onClose: () => void;
};

export function WebpayTransactionModal({
  snapshot,
  isProcessing,
  onSuccess,
  onCancel,
}: WebpayTransactionModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-100 p-0 sm:px-4 sm:py-8">
      <div className="mx-auto min-h-screen w-full overflow-hidden bg-white shadow-2xl sm:min-h-0 sm:max-w-2xl sm:rounded-[8px] sm:border sm:border-slate-200 sm:border-t-[6px] sm:border-t-[#e02424]">
        <div className="border-t-[6px] border-t-[#e02424] sm:border-t-0">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-4 py-5 sm:px-6">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#e02424]">
              Transbank
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              Webpay Plus
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Pasarela externa simulada para ambiente demo.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-slate-200 bg-white text-slate-500 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Cancelar transacción"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6 sm:py-6">
          <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              Monto a pagar
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
              {formatCurrency(snapshot.total)}
            </p>
          </div>

          <div className="mt-5 rounded-[8px] border border-slate-200">
            {snapshot.installments.map((installment) => (
              <div
                key={installment.id}
                className="flex items-center justify-between gap-4 border-t border-slate-100 px-4 py-3 text-sm first:border-t-0"
              >
                <span className="font-semibold text-slate-700">
                  {installment.month}
                </span>
                <span className="font-black text-slate-950">
                  {formatCurrency(installment.amount)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex h-12 w-full items-center justify-center rounded-[8px] border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSuccess}
              disabled={isProcessing}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-[#e02424] px-4 text-sm font-bold text-white transition hover:bg-[#bf1f1f] disabled:cursor-wait disabled:bg-slate-400 sm:h-11"
            >
              {isProcessing && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              )}
              {isProcessing
                ? "Procesando pago"
                : "Simular Éxito de Pago"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReceiptModal({ receipt, student, onClose }: ReceiptModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-tenant-primary/70 p-0 backdrop-blur-sm sm:px-4 sm:py-8">
      <div className="mx-auto min-h-screen w-full bg-white p-4 shadow-2xl sm:min-h-0 sm:max-w-2xl sm:rounded-[8px] sm:p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-[8px] bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" aria-hidden />
        </div>

        <h2 className="mt-5 text-2xl font-black text-tenant-primary sm:text-3xl">
          Pago aprobado
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          La respuesta de Webpay Plus fue recibida correctamente y el webhook
          local actualizó la cuenta corriente de {student.name}.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Metric label="Orden de compra" value={receipt.purchaseOrder} />
          <Metric
            label="Código autorización"
            value={receipt.authorizationCode}
          />
          <Metric label="Monto pagado" value={formatCurrency(receipt.total)} />
          <Metric
            label="Fecha operación"
            value={new Intl.DateTimeFormat("es-CL", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(receipt.paidAt))}
          />
        </div>

        <div className="mt-5 rounded-[8px] border border-slate-200">
          {receipt.installments.map((installment) => (
            <div
              key={installment.id}
              className="flex items-center justify-between gap-4 border-t border-slate-100 px-4 py-3 text-sm first:border-t-0"
            >
              <span className="font-semibold text-slate-700">
                {installment.month}
              </span>
              <span className="font-black text-slate-950">
                {formatCurrency(installment.amount)}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 flex h-11 w-full items-center justify-center rounded-[8px] bg-tenant-primary px-4 text-sm font-bold text-white transition hover:bg-tenant-primary/90"
        >
          Cerrar comprobante
        </button>
      </div>
    </div>
  );
}

export function createReceipt(snapshot: PaymentSnapshot): WebpayReceipt {
  const randomNumber = Math.floor(100000 + Math.random() * 900000);

  return {
    ...snapshot,
    purchaseOrder: `OC-${Date.now().toString().slice(-8)}`,
    authorizationCode: `AUTH-${randomNumber}`,
    paidAt: new Date().toISOString(),
  };
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}
