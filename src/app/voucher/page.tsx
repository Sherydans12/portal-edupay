import Link from "next/link";
import { ArrowLeft, CircleAlert, CircleCheckBig, ReceiptText } from "lucide-react";
import { VoucherDownloadButton } from "@/app/voucher/VoucherDownloadButton";
import { formatCurrency } from "@/lib/format";
import prisma from "@/lib/prisma";

type VoucherPageProps = {
  searchParams: Promise<{
    token_ws?: string | string[];
    status?: string | string[];
  }>;
};

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Santiago",
});

export default async function VoucherPage({ searchParams }: VoucherPageProps) {
  const params = await searchParams;
  const tokenWs = Array.isArray(params.token_ws)
    ? params.token_ws[0]
    : params.token_ws;
  const transaction = tokenWs
    ? await prisma.transaction.findUnique({
        where: { tokenWs },
      })
    : null;

  if (!transaction) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 text-slate-900">
        <section className="w-full max-w-lg rounded-[16px] border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <ReceiptText className="h-8 w-8" aria-hidden />
          </div>
          <h1 className="mt-5 text-2xl font-black text-slate-950">
            Transacción no encontrada
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600">
            No pudimos encontrar un comprobante asociado a este enlace. Revisa
            la dirección o vuelve al portal para consultar tus pagos.
          </p>
          <Link
            href="/"
            className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-tenant-primary px-4 text-sm font-bold text-white transition hover:bg-tenant-primary/90"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Volver al Inicio
          </Link>
        </section>
      </main>
    );
  }

  const isAuthorized = transaction.status === "AUTHORIZED";
  const paymentDate = transaction.updatedAt.toISOString();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 text-slate-900">
      <section className="w-full max-w-xl overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
        <header
          className={`px-6 py-7 text-white sm:px-8 ${
            isAuthorized ? "bg-emerald-700" : "bg-rose-700"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15">
              {isAuthorized ? (
                <CircleCheckBig className="h-8 w-8" aria-hidden />
              ) : (
                <CircleAlert className="h-8 w-8" aria-hidden />
              )}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">
                Comprobante Webpay Plus
              </p>
              <h1 className="mt-1 text-2xl font-black sm:text-3xl">
                {isAuthorized ? "Pago aprobado" : "Pago no completado"}
              </h1>
            </div>
          </div>
        </header>

        <div className="px-6 py-7 sm:px-8">
          <p className="text-sm leading-6 text-slate-600">
            {isAuthorized
              ? "Transbank autorizó la operación. Conserva este comprobante como respaldo de tu pago."
              : "La operación fue rechazada o no pudo completarse. No se registró un pago exitoso."}
          </p>

          <div className="mt-7 divide-y divide-dashed divide-slate-200 border-y border-dashed border-slate-300">
            <ReceiptRow
              label="Fecha"
              value={dateFormatter.format(transaction.updatedAt)}
            />
            <ReceiptRow label="Medio de Pago" value="Webpay Plus" />
            <ReceiptRow
              label="Orden de Compra"
              value={transaction.buyOrder}
            />
            <ReceiptRow
              label="Código de Autorización"
              value={transaction.authorizationCode ?? "No disponible"}
            />
          </div>

          <div className="mt-6 flex items-end justify-between gap-4 rounded-[12px] bg-slate-100 p-5">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Monto Total
            </span>
            <span className="text-2xl font-black text-slate-950 sm:text-3xl">
              {formatCurrency(transaction.amount)}
            </span>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <VoucherDownloadButton
              amount={transaction.amount}
              buyOrder={transaction.buyOrder}
              authorizationCode={transaction.authorizationCode}
              paymentDate={paymentDate}
              isAuthorized={isAuthorized}
            />
            <Link
              href="/"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-tenant-primary px-4 text-sm font-bold text-white transition hover:bg-tenant-primary/90"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Volver al Inicio
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="break-all text-sm font-bold text-slate-950 sm:text-right">
        {value}
      </span>
    </div>
  );
}
