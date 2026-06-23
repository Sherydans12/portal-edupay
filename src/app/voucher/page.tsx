import Link from "next/link";
import prisma from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";

type VoucherPageProps = {
  searchParams: Promise<{
    token?: string | string[];
    status?: string | string[];
  }>;
};

export default async function VoucherPage({ searchParams }: VoucherPageProps) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const transaction = token
    ? await prisma.transaction.findUnique({
        where: { tokenWs: token },
        select: {
          amount: true,
          buyOrder: true,
          status: true,
          authorizationCode: true,
          createdAt: true,
        },
      })
    : null;

  const isSuccess = transaction?.status === "AUTHORIZED";
  const title = isSuccess ? "Pago aprobado" : "Pago no completado";
  const description = isSuccess
    ? "Transbank autorizó la transacción y el pago quedó registrado."
    : "La transacción fue rechazada, cancelada o no pudo confirmarse.";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <section className="mx-auto max-w-xl rounded-[8px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-[8px] text-2xl font-black ${
            isSuccess
              ? "bg-emerald-50 text-emerald-600"
              : "bg-rose-50 text-rose-600"
          }`}
        >
          {isSuccess ? "✓" : "!"}
        </div>

        <h1 className="mt-5 text-3xl font-black text-tenant-primary">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>

        {transaction ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Metric label="Orden de compra" value={transaction.buyOrder} />
            <Metric label="Monto" value={formatCurrency(transaction.amount)} />
            <Metric label="Estado" value={transaction.status} />
            <Metric
              label="Código autorización"
              value={transaction.authorizationCode ?? "No disponible"}
            />
          </div>
        ) : (
          <div className="mt-6 rounded-[8px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            No encontramos una transacción asociada a este comprobante.
          </div>
        )}

        {isSuccess && (
          <Link
            href="/"
            className="mt-6 flex h-11 w-full items-center justify-center rounded-[8px] bg-tenant-primary px-4 text-sm font-bold text-white transition hover:bg-tenant-primary/90"
          >
            Volver al Dashboard
          </Link>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-base font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}
