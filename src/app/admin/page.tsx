import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  CircleDollarSign,
  DatabaseZap,
  Download,
  Filter,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import { SyncRetryButton } from "@/components/admin/SyncRetryButton";
import { TenantSwitcher } from "@/components/tenant-switcher";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  createTransactionWhere,
  normalizeReportDate,
} from "@/lib/transaction-report";

const PAGE_SIZE = 50;

const moneyFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Santiago",
});

type AdminPageProps = {
  searchParams: Promise<{
    page?: string | string[];
    tenant?: string | string[];
    from?: string | string[];
    to?: string | string[];
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "SUPERADMIN") {
    redirect(session?.user?.role === "GUARDIAN" ? "/" : "/login");
  }

  const params = await searchParams;
  const selectedTenantId = getSingleSearchParam(params.tenant);
  const dateFrom = normalizeReportDate(params.from);
  const dateTo = normalizeReportDate(params.to);
  const hasInvalidDateRange = Boolean(
    dateFrom && dateTo && dateFrom > dateTo,
  );
  const requestedPage = Number(getSingleSearchParam(params.page) ?? "1");
  const page = Number.isInteger(requestedPage) && requestedPage > 0
    ? requestedPage
    : 1;

  const transactionWhere = createTransactionWhere({
    tenantId: selectedTenantId,
    dateFrom,
    dateTo,
  });

  const [
    tenants,
    collected,
    successfulTransactions,
    failedTransactions,
    unsyncedTransactions,
    totalTransactions,
    transactions,
  ] = await Promise.all([
    prisma.tenant.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
      where: {
        isActive: true,
      },
    }),
    prisma.transaction.aggregate({
      where: { ...transactionWhere, status: "AUTHORIZED" },
      _sum: { amount: true },
    }),
    prisma.transaction.count({
      where: { ...transactionWhere, status: "AUTHORIZED" },
    }),
    prisma.transaction.count({
      where: {
        ...transactionWhere,
        status: { in: ["REJECTED", "FAILED"] },
      },
    }),
    prisma.transaction.count({
      where: {
        ...transactionWhere,
        status: "AUTHORIZED",
        edupaySynced: false,
      },
    }),
    prisma.transaction.count({ where: transactionWhere }),
    prisma.transaction.findMany({
      where: transactionWhere,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        tenantId: true,
        buyOrder: true,
        amount: true,
        status: true,
        edupaySynced: true,
        createdAt: true,
        guardian: {
          select: {
            rut: true,
          },
        },
        tenant: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const selectedTenant = selectedTenantId
    ? tenants.find((tenant) => tenant.id === selectedTenantId)
    : null;
  const selectedTenantLabel =
    selectedTenant?.name ?? selectedTenantId ?? "Todos los Colegios";
  const scopeLabel = selectedTenantId ? selectedTenantLabel : "Todos los Colegios";
  const adminTitle = `Panel Global - ${scopeLabel}`;
  const totalPages = Math.max(1, Math.ceil(totalTransactions / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  if (currentPage !== page) {
    redirect(
      createAdminHref(currentPage, selectedTenantId, dateFrom, dateTo),
    );
  }

  const metrics = [
    {
      label: selectedTenantId ? "Total recaudado" : "Total recaudado global",
      value: moneyFormatter.format(collected._sum.amount ?? 0),
      icon: CircleDollarSign,
      tone: "text-emerald-700 bg-emerald-50 border-emerald-100",
    },
    {
      label: "Transacciones exitosas",
      value: successfulTransactions.toLocaleString("es-CL"),
      icon: BadgeCheck,
      tone: "text-blue-700 bg-blue-50 border-blue-100",
    },
    {
      label: "Fallidas / rechazadas",
      value: failedTransactions.toLocaleString("es-CL"),
      icon: AlertTriangle,
      tone: "text-rose-700 bg-rose-50 border-rose-100",
    },
    {
      label: "Pagos desincronizados",
      value: unsyncedTransactions.toLocaleString("es-CL"),
      icon: DatabaseZap,
      tone: "text-amber-700 bg-amber-50 border-amber-100",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
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

        <nav className="mt-10">
          <span className="flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2.5 text-sm font-bold text-white">
            <LayoutDashboard className="h-4 w-4" aria-hidden />
            Dashboard global
          </span>
        </nav>

        <div className="mt-auto border-t border-slate-800 pt-5">
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Super Admin
          </p>
          <p className="mb-4 mt-2 truncate px-3 text-sm text-slate-300">
            {session.user.email}
          </p>
          <AdminSignOutButton />
        </div>
      </aside>

      <header className="border-b border-slate-200 bg-white px-4 py-4 lg:ml-64 lg:px-8">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              Operaciones
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight">
              {adminTitle}
            </h1>
          </div>
          <TenantSwitcher
            activeTenantId={selectedTenantId}
            dateFrom={dateFrom}
            dateTo={dateTo}
            tenants={tenants}
          />
        </div>
      </header>

      <main className="px-4 py-6 lg:ml-64 lg:px-8">
        <div className="mx-auto max-w-[1600px]">
          <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-700">
                <CalendarDays className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-black">Rango de conciliación</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Filtra el dashboard y el reporte CSV por fecha de creación.
                </p>
              </div>
            </div>

            <form
              action="/admin"
              method="GET"
              className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-end"
            >
              {selectedTenantId && (
                <input type="hidden" name="tenant" value={selectedTenantId} />
              )}
              <label className="flex-1 text-sm font-bold text-slate-700">
                Desde
                <input
                  type="date"
                  name="from"
                  defaultValue={dateFrom}
                  max={dateTo}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <label className="flex-1 text-sm font-bold text-slate-700">
                Hasta
                <input
                  type="date"
                  name="to"
                  defaultValue={dateTo}
                  min={dateFrom}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <button
                type="submit"
                className="flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <Filter className="h-4 w-4" aria-hidden />
                Aplicar filtros
              </button>
              {(dateFrom || dateTo) && (
                <Link
                  href={createAdminHref(1, selectedTenantId)}
                  className="flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                >
                  Limpiar fechas
                </Link>
              )}
              {hasInvalidDateRange ? (
                <span
                  aria-disabled="true"
                  className="flex h-11 cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-slate-200 px-5 text-sm font-bold text-slate-400"
                >
                  <Download className="h-4 w-4" aria-hidden />
                  Exportar Reporte (CSV)
                </span>
              ) : (
                <a
                  href={createExportHref(selectedTenantId, dateFrom, dateTo)}
                  download
                  className="flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  <Download className="h-4 w-4" aria-hidden />
                  Exportar Reporte (CSV)
                </a>
              )}
            </form>

            {hasInvalidDateRange && (
              <p className="mt-3 text-sm font-semibold text-rose-700" role="alert">
                La fecha inicial no puede ser posterior a la fecha final.
              </p>
            )}
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;

              return (
                <article
                  key={metric.label}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">
                        {metric.label}
                      </p>
                      <p className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                        {metric.value}
                      </p>
                    </div>
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg border ${metric.tone}`}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-black">
                  {selectedTenantId
                    ? `Transacciones de ${selectedTenantLabel}`
                    : "Transacciones globales"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {totalTransactions.toLocaleString("es-CL")} registros{" "}
                  {selectedTenantId
                    ? `para tenantId ${selectedTenantId}.`
                    : "en todos los colegios."}
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-500">
                Página {currentPage} de {totalPages}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1180px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-bold">ID transacción</th>
                    <th className="px-5 py-3 font-bold">
                      Colegio / Tenant ID
                    </th>
                    <th className="px-5 py-3 font-bold">Apoderado</th>
                    <th className="px-5 py-3 font-bold">Monto</th>
                    <th className="px-5 py-3 font-bold">Fecha</th>
                    <th className="px-5 py-3 font-bold">Webpay</th>
                    <th className="px-5 py-3 font-bold">EduPay</th>
                    <th className="px-5 py-3 font-bold">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="align-middle transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900">
                          {transaction.buyOrder}
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-slate-400">
                          {transaction.id}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600">
                        <p className="font-sans text-sm font-bold text-slate-800">
                          {transaction.tenant.name}
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-slate-500">
                          {transaction.tenantId}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {transaction.guardian.rut}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {moneyFormatter.format(transaction.amount)}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {dateFormatter.format(transaction.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={transaction.status} />
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                            transaction.edupaySynced
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-800"
                          }`}
                        >
                          {transaction.edupaySynced
                            ? "Sincronizado"
                            : "Pendiente"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {!transaction.edupaySynced &&
                        transaction.status === "AUTHORIZED" ? (
                          <SyncRetryButton buyOrder={transaction.buyOrder} />
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {transactions.length === 0 && (
              <div className="grid place-items-center px-5 py-16 text-center">
                <DatabaseZap className="h-8 w-8 text-slate-300" aria-hidden />
                <p className="mt-3 font-bold text-slate-700">
                  Aún no hay transacciones
                </p>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
              <PaginationLink
                dateFrom={dateFrom}
                dateTo={dateTo}
                page={currentPage - 1}
                disabled={currentPage <= 1}
                label="Anterior"
                tenantId={selectedTenantId}
              />
              <PaginationLink
                dateFrom={dateFrom}
                dateTo={dateTo}
                page={currentPage + 1}
                disabled={currentPage >= totalPages}
                label="Siguiente"
                tenantId={selectedTenantId}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function getSingleSearchParam(value?: string | string[]) {
  const resolvedValue = Array.isArray(value) ? value[0] : value;
  const trimmedValue = resolvedValue?.trim();

  return trimmedValue || undefined;
}

function createAdminHref(
  page: number,
  tenantId?: string | null,
  dateFrom?: string,
  dateTo?: string,
) {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("page", String(page));
  }

  if (tenantId) {
    params.set("tenant", tenantId);
  }

  if (dateFrom) {
    params.set("from", dateFrom);
  }

  if (dateTo) {
    params.set("to", dateTo);
  }

  const queryString = params.toString();
  return queryString ? `/admin?${queryString}` : "/admin";
}

function createExportHref(
  tenantId?: string | null,
  dateFrom?: string,
  dateTo?: string,
) {
  const params = new URLSearchParams();

  if (tenantId) {
    params.set("tenant", tenantId);
  }

  if (dateFrom) {
    params.set("from", dateFrom);
  }

  if (dateTo) {
    params.set("to", dateTo);
  }

  const queryString = params.toString();
  return `/api/admin/transactions/export${queryString ? `?${queryString}` : ""}`;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    AUTHORIZED: "bg-emerald-50 text-emerald-700",
    REJECTED: "bg-rose-50 text-rose-700",
    FAILED: "bg-rose-50 text-rose-700",
    PENDING: "bg-blue-50 text-blue-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
        styles[status] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}

function PaginationLink({
  dateFrom,
  dateTo,
  disabled,
  label,
  page,
  tenantId,
}: {
  dateFrom?: string;
  dateTo?: string;
  disabled: boolean;
  label: string;
  page: number;
  tenantId?: string | null;
}) {
  if (disabled) {
    return (
      <span className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-300">
        {label}
      </span>
    );
  }

  return (
    <Link
      href={createAdminHref(page, tenantId, dateFrom, dateTo)}
      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
    >
      {label}
    </Link>
  );
}
