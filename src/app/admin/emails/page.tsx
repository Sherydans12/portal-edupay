import {
  EmailStatus,
  EmailType,
  type Prisma,
} from "@prisma/client";
import {
  Eye,
  Filter,
  LayoutDashboard,
  Mail,
  RotateCcw,
} from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const PAGE_SIZE = 25;
const EMAIL_STATUSES = Object.values(EmailStatus);
const EMAIL_TYPES = Object.values(EmailType);

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "short",
  timeStyle: "medium",
  timeZone: "America/Santiago",
});

const emailTypeLabels: Record<EmailType, string> = {
  PAYMENT_RECEIPT: "Comprobante de pago",
  FORGOT_PASSWORD: "Recuperación de clave",
  WELCOME: "Bienvenida",
  SYSTEM: "Sistema",
};

const emailStatusLabels: Record<EmailStatus, string> = {
  SENT: "Enviado",
  FAILED: "Fallido",
  SIMULATED: "Simulado",
};

type EmailsPageProps = {
  searchParams: Promise<{
    page?: string | string[];
    tenant?: string | string[];
    status?: string | string[];
    type?: string | string[];
  }>;
};

export default async function AdminEmailsPage({
  searchParams,
}: EmailsPageProps) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "SUPERADMIN") {
    redirect(session?.user?.role === "GUARDIAN" ? "/" : "/login");
  }

  const params = await searchParams;
  const selectedTenantId = getSingleSearchParam(params.tenant);
  const selectedStatus = getEnumParam(params.status, EMAIL_STATUSES);
  const selectedType = getEnumParam(params.type, EMAIL_TYPES);
  const requestedPage = Number(getSingleSearchParam(params.page) ?? "1");
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const where: Prisma.EmailLogWhereInput = {
    ...(selectedTenantId ? { tenantId: selectedTenantId } : {}),
    ...(selectedStatus ? { status: selectedStatus } : {}),
    ...(selectedType ? { type: selectedType } : {}),
  };

  const [tenants, totalEmailLogs, emailLogs] = await Promise.all([
    prisma.tenant.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.emailLog.count({ where }),
    prisma.emailLog.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        tenantId: true,
        to: true,
        subject: true,
        type: true,
        status: true,
        error: true,
        createdAt: true,
        tenant: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalEmailLogs / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  if (currentPage !== page) {
    redirect(
      createEmailsHref({
        page: currentPage,
        tenantId: selectedTenantId,
        status: selectedStatus,
        type: selectedType,
      }),
    );
  }

  const hasFilters = Boolean(
    selectedTenantId || selectedStatus || selectedType,
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <AdminSidebar
        activeSection="emails"
        adminEmail={session.user.email}
      />

      <header className="border-b border-slate-200 bg-white px-4 py-4 lg:ml-64 lg:px-8">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              Comunicaciones
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight">
              Historial de correos
            </h1>
          </div>
          <Link
            href="/admin"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 lg:hidden"
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="px-4 py-6 lg:ml-64 lg:px-8">
        <div className="mx-auto max-w-[1600px]">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-700">
                <Filter className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-black">Filtros del historial</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Consulta los resultados reales y simulados por colegio.
                </p>
              </div>
            </div>

            <form
              action="/admin/emails"
              method="GET"
              className="mt-5 grid gap-4 md:grid-cols-3 xl:grid-cols-[1fr_1fr_1fr_auto_auto]"
            >
              <FilterSelect
                label="Tenant"
                name="tenant"
                defaultValue={selectedTenantId}
              >
                <option value="">Todos los colegios</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </FilterSelect>

              <FilterSelect
                label="Estado"
                name="status"
                defaultValue={selectedStatus}
              >
                <option value="">Todos los estados</option>
                {EMAIL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {emailStatusLabels[status]} ({status})
                  </option>
                ))}
              </FilterSelect>

              <FilterSelect
                label="Tipo de correo"
                name="type"
                defaultValue={selectedType}
              >
                <option value="">Todos los tipos</option>
                {EMAIL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {emailTypeLabels[type]}
                  </option>
                ))}
              </FilterSelect>

              <button
                type="submit"
                className="flex h-11 items-center justify-center gap-2 self-end rounded-lg bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <Filter className="h-4 w-4" aria-hidden />
                Aplicar
              </button>

              {hasFilters && (
                <Link
                  href="/admin/emails"
                  className="flex h-11 items-center justify-center gap-2 self-end rounded-lg border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  Limpiar
                </Link>
              )}
            </form>
          </section>

          <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-black">Registro de entregas</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {totalEmailLogs.toLocaleString("es-CL")} correos encontrados.
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-500">
                Página {currentPage} de {totalPages}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-bold">Fecha / Hora</th>
                    <th className="px-5 py-3 font-bold">Tenant</th>
                    <th className="px-5 py-3 font-bold">Destinatario</th>
                    <th className="px-5 py-3 font-bold">Asunto</th>
                    <th className="px-5 py-3 font-bold">Tipo</th>
                    <th className="px-5 py-3 font-bold">Estado</th>
                    <th className="px-5 py-3 font-bold">Detalle / Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {emailLogs.map((emailLog) => (
                    <tr
                      key={emailLog.id}
                      className="align-top transition hover:bg-slate-50/80"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {dateFormatter.format(emailLog.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800">
                          {emailLog.tenant.name}
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-slate-500">
                          {emailLog.tenantId}
                        </p>
                      </td>
                      <td className="max-w-64 break-all px-5 py-4 font-semibold text-slate-700">
                        {emailLog.to}
                      </td>
                      <td className="max-w-72 px-5 py-4 font-semibold text-slate-800">
                        {emailLog.subject}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                          {emailTypeLabels[emailLog.type]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <EmailStatusBadge status={emailLog.status} />
                      </td>
                      <td className="px-5 py-4">
                        <details className="group">
                          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700">
                            <Eye className="h-3.5 w-3.5" aria-hidden />
                            Ver detalle
                          </summary>
                          <div className="mt-3 w-80 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                            <p>
                              <span className="font-bold text-slate-800">
                                ID:
                              </span>{" "}
                              <span className="break-all font-mono">
                                {emailLog.id}
                              </span>
                            </p>
                            <p className="mt-2">
                              <span className="font-bold text-slate-800">
                                Tipo:
                              </span>{" "}
                              {emailLog.type}
                            </p>
                            <p className="mt-2">
                              <span className="font-bold text-slate-800">
                                Resultado:
                              </span>{" "}
                              {emailLog.error ?? "Sin error reportado."}
                            </p>
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {emailLogs.length === 0 && (
              <div className="grid place-items-center px-5 py-16 text-center">
                <Mail className="h-8 w-8 text-slate-300" aria-hidden />
                <p className="mt-3 font-bold text-slate-700">
                  No hay correos para estos filtros
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Los próximos envíos aparecerán aquí automáticamente.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
              <PaginationLink
                page={currentPage - 1}
                disabled={currentPage <= 1}
                label="Anterior"
                tenantId={selectedTenantId}
                status={selectedStatus}
                type={selectedType}
              />
              <PaginationLink
                page={currentPage + 1}
                disabled={currentPage >= totalPages}
                label="Siguiente"
                tenantId={selectedTenantId}
                status={selectedStatus}
                type={selectedType}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function FilterSelect({
  children,
  defaultValue,
  label,
  name,
}: {
  children: React.ReactNode;
  defaultValue?: string;
  label: string;
  name: string;
}) {
  return (
    <label className="text-sm font-bold text-slate-700">
      {label}
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      >
        {children}
      </select>
    </label>
  );
}

function EmailStatusBadge({ status }: { status: EmailStatus }) {
  const styles: Record<EmailStatus, string> = {
    SENT: "bg-emerald-50 text-emerald-700",
    FAILED: "bg-rose-50 text-rose-700",
    SIMULATED: "bg-amber-50 text-amber-800",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${styles[status]}`}
    >
      {emailStatusLabels[status]}
    </span>
  );
}

function PaginationLink({
  disabled,
  label,
  page,
  tenantId,
  status,
  type,
}: {
  disabled: boolean;
  label: string;
  page: number;
  tenantId?: string;
  status?: EmailStatus;
  type?: EmailType;
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
      href={createEmailsHref({ page, tenantId, status, type })}
      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
    >
      {label}
    </Link>
  );
}

function createEmailsHref({
  page,
  tenantId,
  status,
  type,
}: {
  page: number;
  tenantId?: string;
  status?: EmailStatus;
  type?: EmailType;
}) {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("page", String(page));
  }

  if (tenantId) {
    params.set("tenant", tenantId);
  }

  if (status) {
    params.set("status", status);
  }

  if (type) {
    params.set("type", type);
  }

  const queryString = params.toString();
  return queryString ? `/admin/emails?${queryString}` : "/admin/emails";
}

function getSingleSearchParam(value?: string | string[]) {
  const resolvedValue = Array.isArray(value) ? value[0] : value;
  const trimmedValue = resolvedValue?.trim();

  return trimmedValue || undefined;
}

function getEnumParam<T extends string>(
  value: string | string[] | undefined,
  allowedValues: readonly T[],
) {
  const resolvedValue = getSingleSearchParam(value);

  return resolvedValue && allowedValues.includes(resolvedValue as T)
    ? (resolvedValue as T)
    : undefined;
}
