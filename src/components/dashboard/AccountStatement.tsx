"use client";

import { CheckCircle, CreditCard, GraduationCap, Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Installment, InstallmentStatus, Student } from "@/types/payments";

type StudentSelectorProps = {
  students: Student[];
  selectedStudentId: string;
  onSelectStudent: (studentId: string) => void;
};

type AccountStatementProps = {
  student: Student;
  selectedIds: string[];
  isCreatingTransaction: boolean;
  onToggleInstallment: (installment: Installment) => void;
  onStartWebpayTransaction: () => void;
};

const statusCopy: Record<
  InstallmentStatus,
  { label: string; className: string; dotClassName: string }
> = {
  PAGADO: {
    label: "Pagado",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dotClassName: "bg-emerald-500",
  },
  VENCIDO: {
    label: "Vencido",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    dotClassName: "bg-rose-500",
  },
  POR_VENCER: {
    label: "Por vencer",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    dotClassName: "bg-amber-500",
  },
};

export function StudentSelector({
  students,
  selectedStudentId,
  onSelectStudent,
}: StudentSelectorProps) {
  return (
    <div className="mb-6">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-tenant-secondary">
        Alumnos vinculados
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {students.map((student) => {
          const isSelected = student.id === selectedStudentId;
          const debt = getDebt(student.installments);

          return (
            <button
              key={student.id}
              type="button"
              onClick={() => onSelectStudent(student.id)}
              className={`rounded-[8px] border bg-white p-4 text-left shadow-sm transition hover:border-tenant-primary/40 ${
                isSelected
                  ? "border-tenant-primary ring-4 ring-tenant-primary/10"
                  : "border-slate-200"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-tenant-primary/10 text-tenant-primary">
                    <GraduationCap className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-950">{student.name}</h2>
                    <p className="text-sm text-slate-500">{student.course}</p>
                  </div>
                </div>
                <span className="w-fit rounded-full border border-tenant-secondary/40 bg-tenant-secondary/10 px-3 py-1 text-xs font-bold text-tenant-primary">
                  {formatCurrency(debt)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AccountStatement({
  student,
  selectedIds,
  isCreatingTransaction,
  onToggleInstallment,
  onStartWebpayTransaction,
}: AccountStatementProps) {
  const payableInstallments = student.installments.filter(
    (item) => item.status !== "PAGADO",
  );
  const selectedInstallments = student.installments.filter((item) =>
    selectedIds.includes(item.id),
  );
  const selectedTotal = getDebt(selectedInstallments);
  const totalDebt = getDebt(payableInstallments);

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-tenant-secondary">
                Estado de cuenta
              </p>
              <h1 className="mt-2 text-2xl font-black text-tenant-primary sm:text-3xl">
                {student.name}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {student.course} · Cuenta {student.accountNumber}
              </p>
            </div>
            <div className="rounded-[8px] bg-tenant-primary px-4 py-3 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
                Deuda total
              </p>
              <p className="mt-1 text-2xl font-black">
                {formatCurrency(totalDebt)}
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-[8px] border border-slate-200">
            {payableInstallments.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-[8px] bg-emerald-50 text-emerald-600">
                  <CheckCircle className="h-10 w-10" aria-hidden />
                </div>
                <p className="mt-4 max-w-md text-base font-bold leading-7 text-slate-700">
                  ¡Estás al día! No tienes deudas pendientes por el momento.
                </p>
              </div>
            ) : (
              <>
                <div className="hidden min-w-[760px] grid-cols-[56px_1fr_150px_130px_140px] bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-slate-500 md:grid">
                  <span />
                  <span>Mensualidad</span>
                  <span>Vencimiento</span>
                  <span>Estado</span>
                  <span className="text-right">Monto</span>
                </div>

                {student.installments.map((installment) => {
              const isSelected = selectedIds.includes(installment.id);
              const isPaid = installment.status === "PAGADO";

              return (
                <label
                  key={installment.id}
                  className={`block cursor-pointer border-t border-slate-100 px-4 py-4 transition first:border-t-0 md:grid md:min-w-[760px] md:grid-cols-[56px_1fr_150px_130px_140px] md:items-center md:gap-3 ${
                    isPaid ? "bg-slate-50/70" : "bg-white hover:bg-slate-50"
                  }`}
                >
                  <span className="hidden items-center md:flex">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isPaid || isCreatingTransaction}
                      onChange={() => onToggleInstallment(installment)}
                      className="h-5 w-5 rounded border-slate-300 text-tenant-primary accent-tenant-primary disabled:cursor-not-allowed"
                    />
                  </span>
                  <span className="hidden md:block">
                    <span className="block font-bold text-slate-950">
                      {installment.month}
                    </span>
                    <span className="text-sm text-slate-500">
                      Mensualidad escolar 2026
                    </span>
                  </span>
                  <span className="hidden text-sm font-medium text-slate-600 md:block">
                    {formatDate(installment.dueDate)}
                  </span>
                  <span className="hidden md:block">
                    <StatusBadge status={installment.status} />
                  </span>
                  <span className="hidden text-left text-base font-black text-slate-950 md:block md:text-right">
                    {formatCurrency(installment.amount)}
                  </span>
                  <span className="md:hidden">
                    <span className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isPaid || isCreatingTransaction}
                        onChange={() => onToggleInstallment(installment)}
                        className="mt-1 h-5 w-5 rounded border-slate-300 text-tenant-primary accent-tenant-primary disabled:cursor-not-allowed"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-black text-slate-950">
                            Mensualidad {installment.month}
                          </span>
                          <StatusBadge status={installment.status} />
                        </span>
                        <span className="mt-3 grid grid-cols-2 gap-3 text-sm">
                          <span>
                            <span className="block text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
                              Vence
                            </span>
                            <span className="font-semibold text-slate-700">
                              {formatDate(installment.dueDate)}
                            </span>
                          </span>
                          <span className="text-right">
                            <span className="block text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
                              Monto
                            </span>
                            <span className="font-black text-slate-950">
                              {formatCurrency(installment.amount)}
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>
                </label>
              );
                })}
              </>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-tenant-secondary">
            Pago seleccionado
          </p>
          <div className="mt-5 space-y-3">
            <Metric label="Cuotas seleccionadas" value={`${selectedIds.length}`} />
            <Metric label="Total a pagar" value={formatCurrency(selectedTotal)} />
          </div>
          <button
            type="button"
            disabled={selectedTotal === 0 || isCreatingTransaction}
            onClick={onStartWebpayTransaction}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-tenant-primary px-4 text-base font-bold text-white shadow-lg shadow-tenant-primary/20 transition hover:bg-tenant-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            {isCreatingTransaction ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <CreditCard className="h-5 w-5" aria-hidden />
            )}
            {isCreatingTransaction ? "Creando transacción" : "Pagar con Webpay"}
          </button>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            El pago exitoso actualiza el historial y habilita certificados
            cuando la deuda queda saldada.
          </p>
        </aside>
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: InstallmentStatus }) {
  const current = statusCopy[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${current.className}`}
    >
      <span className={`h-2 w-2 rounded-full ${current.dotClassName}`} />
      {current.label}
    </span>
  );
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

export function getDebt(installments: Installment[]) {
  return installments
    .filter((installment) => installment.status !== "PAGADO")
    .reduce((total, installment) => total + installment.amount, 0);
}
