import Link from "next/link";
import {
  ArrowLeft,
  CircleAlert,
  CircleCheckBig,
  Info,
  ReceiptText,
  RotateCcw,
} from "lucide-react";
import { VoucherDownloadButton } from "@/app/voucher/VoucherDownloadButton";
import { VoucherPrintButton } from "@/app/voucher/VoucherPrintButton";
import {
  getEdupayTenantId,
  getGuardianStatement,
} from "@/lib/edupay";
import { formatCurrency } from "@/lib/format";
import prisma from "@/lib/prisma";
import type { PaymentReceiptItem } from "@/types/payments";

type VoucherPageProps = {
  searchParams: Promise<{
    token_ws?: string | string[];
    status?: string | string[];
  }>;
};

type VoucherStateVariant = "info" | "warning" | "error" | "neutral";

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Santiago",
});

export default async function VoucherPage({ searchParams }: VoucherPageProps) {
  const params = await searchParams;
  const tokenWs = firstSearchParam(params.token_ws);
  const callbackStatus = firstSearchParam(params.status);

  if (callbackStatus === "cancelled") {
    return (
      <VoucherState
        variant="info"
        title="Pago cancelado por el usuario"
        description="Cancelaste la operación antes de confirmar el pago. No se realizó ningún cargo a tu tarjeta."
        actionLabel="Regresar al estado de cuenta"
      />
    );
  }

  if (callbackStatus === "timeout") {
    return (
      <VoucherState
        variant="warning"
        title="Tiempo de espera agotado"
        description="La sesión de Webpay expiró antes de completar la operación. Puedes regresar al estado de cuenta e intentarlo nuevamente."
        actionLabel="Regresar al estado de cuenta"
      />
    );
  }

  if (callbackStatus === "processing") {
    return (
      <VoucherState
        variant="info"
        title="Pago en verificación"
        description="Transbank ya recibió esta operación, pero todavía estamos recuperando su resultado. Revisa tu estado de cuenta nuevamente en unos instantes."
        actionLabel="Regresar al estado de cuenta"
      />
    );
  }

  const tenantId = getEdupayTenantId();
  const transaction = tokenWs
    ? await prisma.transaction.findFirst({
        where: { tokenWs, tenantId },
        include: {
          guardian: {
            select: { rut: true },
          },
        },
      })
    : null;

  if (!transaction) {
    return (
      <VoucherState
        variant="neutral"
        title="Transacción no encontrada"
        description="No pudimos encontrar un comprobante asociado a este enlace. Revisa la dirección o vuelve al portal para consultar tus pagos."
        actionLabel="Volver al inicio"
      />
    );
  }

  const effectivePaymentDate =
    transaction.transactionDate ?? transaction.updatedAt;

  if (transaction.status === "REJECTED") {
    return (
      <RejectedTransactionState
        buyOrder={transaction.buyOrder}
        paymentDate={effectivePaymentDate}
      />
    );
  }

  if (transaction.status === "FAILED") {
    return (
      <VoucherState
        variant="error"
        title="No pudimos confirmar la transacción"
        description="Ocurrió un problema al consultar el resultado en Transbank. Antes de volver a pagar, revisa tu estado de cuenta o los movimientos de tu tarjeta."
        actionLabel="Revisar estado de cuenta"
      />
    );
  }

  if (transaction.status !== "AUTHORIZED") {
    return (
      <VoucherState
        variant="info"
        title="Pago en verificación"
        description="La transacción todavía está siendo procesada. Revisa nuevamente tu estado de cuenta en unos instantes."
        actionLabel="Regresar al estado de cuenta"
      />
    );
  }

  const paymentDate = effectivePaymentDate.toISOString();
  const receiptItems = await resolveReceiptItems(
    transaction.receiptItems,
    transaction.edupayPayload,
    transaction.guardian.rut,
  );

  return (
    <main className="voucher-page flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 text-slate-900">
      <section className="voucher-receipt w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
        <header className="bg-emerald-700 px-6 py-7 text-white sm:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15">
              <CircleCheckBig className="h-8 w-8" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">
                Comprobante Webpay Plus
              </p>
              <h1 className="mt-1 text-2xl font-black sm:text-3xl">
                Pago aprobado
              </h1>
            </div>
          </div>
        </header>

        <div className="voucher-content px-6 py-7 sm:px-8">
          <p className="text-sm leading-6 text-slate-600">
            Transbank autorizó la operación. Conserva este comprobante como
            respaldo de tu pago.
          </p>

          <dl className="mt-7 grid divide-y divide-dashed divide-slate-200 border-y border-dashed border-slate-300 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div className="sm:pr-6">
              <ReceiptRow
                label="Fecha y hora"
                value={dateFormatter.format(effectivePaymentDate)}
              />
              <ReceiptRow label="Medio de pago" value="Webpay Plus" />
              <ReceiptRow
                label="Últimos 4 dígitos"
                value={
                  transaction.cardLastFour
                    ? `•••• ${transaction.cardLastFour}`
                    : "No disponible"
                }
              />
            </div>
            <div className="sm:pl-6">
              <ReceiptRow
                label="Orden de compra"
                value={transaction.buyOrder}
              />
              <ReceiptRow
                label="Código de autorización"
                value={transaction.authorizationCode ?? "No disponible"}
              />
              <ReceiptRow
                label="Cuotas de la tarjeta"
                value={formatInstallments(transaction.installmentsNumber)}
              />
            </div>
          </dl>

          <section className="mt-7" aria-labelledby="paid-installments-title">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                  Detalle del pago
                </p>
                <h2
                  id="paid-installments-title"
                  className="mt-1 text-lg font-black text-slate-950"
                >
                  Cuotas pagadas
                </h2>
              </div>
              <span className="text-sm font-semibold text-slate-500">
                {receiptItems.length} {receiptItems.length === 1 ? "cuota" : "cuotas"}
              </span>
            </div>

            <div className="voucher-table-wrapper mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="voucher-items-table w-full min-w-[640px] border-collapse text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-[0.1em] text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-bold">
                      Alumno
                    </th>
                    <th scope="col" className="px-4 py-3 font-bold">
                      Concepto
                    </th>
                    <th scope="col" className="px-4 py-3 font-bold">
                      Mes
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-bold">
                      Monto
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receiptItems.length > 0 ? (
                    receiptItems.map((item) => (
                      <tr key={item.installmentId}>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {item.studentName}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {item.concept}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {item.month}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-slate-900">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-5 text-center text-sm text-slate-500"
                      >
                        El detalle de cuotas no está disponible para esta
                        transacción anterior.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mt-6 flex items-end justify-between gap-4 rounded-xl bg-slate-100 p-5">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Monto total
            </span>
            <span className="text-2xl font-black text-slate-950 sm:text-3xl">
              {formatCurrency(transaction.amount)}
            </span>
          </div>

          <div className="print-hidden mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <VoucherPrintButton />
            <VoucherDownloadButton
              amount={transaction.amount}
              buyOrder={transaction.buyOrder}
              authorizationCode={transaction.authorizationCode}
              paymentDate={paymentDate}
              isAuthorized
            />
            <Link
              href="/"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-tenant-primary px-4 text-sm font-bold text-white transition hover:bg-tenant-primary/90"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Estado de cuenta
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function RejectedTransactionState({
  buyOrder,
  paymentDate,
}: {
  buyOrder: string;
  paymentDate: Date;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-rose-50 px-4 py-10 text-slate-900">
      <section
        className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-xl shadow-rose-950/5"
        role="alert"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-700">
          <CircleAlert className="h-8 w-8" aria-hidden />
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-rose-700">
          Webpay Plus
        </p>
        <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
          Transacción Rechazada por el Emisor
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-600">
          El banco emisor no autorizó la operación. No se realizó ningún cargo
          a tu tarjeta; puedes revisar los datos e intentarlo nuevamente.
        </p>

        <dl className="mt-6 rounded-xl bg-slate-50 px-5 py-2 text-left">
          <ReceiptRow label="Orden de compra" value={buyOrder} />
          <ReceiptRow label="Fecha y hora" value={dateFormatter.format(paymentDate)} />
        </dl>

        <Link
          href="/"
          className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-rose-700 px-4 text-sm font-bold text-white transition hover:bg-rose-800"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Volver a Intentar
        </Link>
      </section>
    </main>
  );
}

function VoucherState({
  variant,
  title,
  description,
  actionLabel,
}: {
  variant: VoucherStateVariant;
  title: string;
  description: string;
  actionLabel: string;
}) {
  const styles: Record<
    VoucherStateVariant,
    { page: string; icon: string; button: string }
  > = {
    info: {
      page: "bg-sky-50",
      icon: "bg-sky-100 text-sky-700",
      button: "bg-tenant-primary hover:bg-tenant-primary/90",
    },
    warning: {
      page: "bg-amber-50",
      icon: "bg-amber-100 text-amber-700",
      button: "bg-tenant-primary hover:bg-tenant-primary/90",
    },
    error: {
      page: "bg-rose-50",
      icon: "bg-rose-100 text-rose-700",
      button: "bg-rose-700 hover:bg-rose-800",
    },
    neutral: {
      page: "bg-slate-100",
      icon: "bg-slate-100 text-slate-500",
      button: "bg-tenant-primary hover:bg-tenant-primary/90",
    },
  };
  const current = styles[variant];
  const StateIcon =
    variant === "info"
      ? Info
      : variant === "neutral"
        ? ReceiptText
        : CircleAlert;

  return (
    <main
      className={`flex min-h-screen items-center justify-center px-4 py-10 text-slate-900 ${current.page}`}
    >
      <section
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/5"
        role={variant === "error" ? "alert" : "status"}
      >
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${current.icon}`}
        >
          <StateIcon className="h-8 w-8" aria-hidden />
        </div>
        <h1 className="mt-5 text-2xl font-black text-slate-950">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
          {description}
        </p>
        <Link
          href="/"
          className={`mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold text-white transition ${current.button}`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {actionLabel}
        </Link>
      </section>
    </main>
  );
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatInstallments(installments: number | null) {
  if (installments === null) {
    return "No disponible";
  }

  return installments > 0
    ? `${installments} ${installments === 1 ? "cuota" : "cuotas"}`
    : "Sin cuotas";
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="m-0 break-all text-sm font-bold text-slate-950 sm:text-right">
        {value}
      </dd>
    </div>
  );
}

async function resolveReceiptItems(
  storedItems: unknown,
  edupayPayload: unknown,
  guardianRut: string,
): Promise<PaymentReceiptItem[]> {
  const receiptItems = parseReceiptItems(storedItems);

  if (receiptItems.length > 0) {
    return receiptItems;
  }

  const installmentIds = parseInstallmentIds(edupayPayload);

  if (installmentIds.length === 0) {
    return [];
  }

  try {
    const statement = await getGuardianStatement(guardianRut);

    return statement.students.flatMap((student) =>
      student.installments
        .filter((installment) => installmentIds.includes(installment.id))
        .map((installment) => ({
          installmentId: installment.id,
          studentName: student.name,
          concept: "Mensualidad escolar",
          month: installment.month,
          amount: installment.amount,
        })),
    );
  } catch (error) {
    console.error(
      "No se pudo recuperar el detalle histórico del comprobante",
      error instanceof Error ? error.message : "Error desconocido",
    );
    return [];
  }
}

function parseReceiptItems(value: unknown): PaymentReceiptItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (
      typeof item !== "object" ||
      item === null ||
      !("installmentId" in item) ||
      !("studentName" in item) ||
      !("concept" in item) ||
      !("month" in item) ||
      !("amount" in item) ||
      typeof item.installmentId !== "number" ||
      !Number.isInteger(item.installmentId) ||
      typeof item.studentName !== "string" ||
      typeof item.concept !== "string" ||
      typeof item.month !== "string" ||
      typeof item.amount !== "number" ||
      !Number.isInteger(item.amount)
    ) {
      return [];
    }

    return [
      {
        installmentId: item.installmentId,
        studentName: item.studentName,
        concept: item.concept,
        month: item.month,
        amount: item.amount,
      },
    ];
  });
}

function parseInstallmentIds(payload: unknown) {
  if (!Array.isArray(payload)) {
    return [];
  }

  const ids = payload.map(Number);
  return ids.length > 0 && ids.every(Number.isInteger) ? ids : [];
}
