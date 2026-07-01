"use client";

import { CheckCircle, CreditCard, GraduationCap, Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import type { EdupayStatementResponse } from "@/lib/edupay";
import type { Installment, InstallmentStatus, Student } from "@/types/payments";

type StudentSelectorProps = {
  students: Student[];
  selectedStudentId: string;
  onSelectStudent: (studentId: string) => void;
};

type AccountStatementProps = {
  statement: EdupayStatementResponse;
  selectedCuotas: number[];
  isCreatingTransaction: boolean;
  onToggleInstallment: (installment: Installment) => void;
  onStartWebpayTransaction: () => void;
};

const statusCopy: Record<
  InstallmentStatus,
  { label: string; className: string; dotClassName: string }
> = {
  PAGADO: {
    label: "PAGADO",
    className: "bg-emerald-100 text-emerald-700",
    dotClassName: "bg-emerald-500",
  },
  VENCIDO: {
    label: "VENCIDO",
    className: "bg-red-100 text-red-700",
    dotClassName: "bg-rose-500",
  },
  POR_VENCER: {
    label: "PENDIENTE",
    className: "bg-amber-100 text-amber-700",
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
                  <StudentIcon />
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
  statement,
  selectedCuotas,
  isCreatingTransaction,
  onToggleInstallment,
  onStartWebpayTransaction,
}: AccountStatementProps) {
  const allInstallments = statement.students.flatMap(
    (student) => student.installments,
  );
  const selectedInstallments = allInstallments.filter(
    (installment) =>
      installment.status !== "PAGADO" &&
      selectedCuotas.includes(installment.id),
  );
  const selectedTotal = getDebt(selectedInstallments);
  const totalDebt = getDebt(allInstallments);
  const hasMultipleStudents = statement.students.length > 1;
  const accountTitle =
    statement.students.length === 1
      ? `Estado de Cuenta de ${statement.students[0].name}`
      : "Estado de Cuenta Familiar";
  const hasSelectedCuotas = selectedCuotas.length > 0;

  return (
    <div className={hasSelectedCuotas ? "pb-36 sm:pb-28" : ""}>
      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-tenant-secondary">
            Portal de pagos
          </p>
          <h1 className="mt-2 text-2xl font-black text-tenant-primary sm:text-3xl">
            {accountTitle}
          </h1>
          {hasMultipleStudents && (
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Selecciona cuotas de distintos alumnos y págalas juntas en una
              sola transacción.
            </p>
          )}
        </div>
        <div className="rounded-xl bg-tenant-primary px-5 py-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
            {hasMultipleStudents ? "Deuda familiar" : "Deuda total"}
          </p>
          <p className="mt-1 text-2xl font-black">
            {formatCurrency(totalDebt)}
          </p>
        </div>
      </div>

      <div>
        <div>
          {statement.students.length === 0 ? (
            <EmptyStudents />
          ) : (
            statement.students.map((student) => (
              <StudentStatementCard
                key={student.id}
                student={student}
                selectedCuotas={selectedCuotas}
                isCreatingTransaction={isCreatingTransaction}
                onToggleInstallment={onToggleInstallment}
              />
            ))
          )}
        </div>
      </div>

      <PaymentBar
        isVisible={hasSelectedCuotas}
        selectedCount={selectedInstallments.length}
        selectedTotal={selectedTotal}
        isCreatingTransaction={isCreatingTransaction}
        onStartWebpayTransaction={onStartWebpayTransaction}
      />
    </div>
  );
}

function StudentStatementCard({
  student,
  selectedCuotas,
  isCreatingTransaction,
  onToggleInstallment,
}: {
  student: Student;
  selectedCuotas: number[];
  isCreatingTransaction: boolean;
  onToggleInstallment: (installment: Installment) => void;
}) {
  const payableInstallments = student.installments.filter(
    (installment) => installment.status !== "PAGADO",
  );
  const studentDebt = getDebt(student.installments);

  return (
    <article className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <StudentIcon />
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-tenant-primary">
              {student.name}
            </h2>
            <p className="truncate text-sm text-slate-500">
              Cuenta {student.accountNumber} · Deuda{" "}
              <span className="font-bold text-slate-700">
                {formatCurrency(studentDebt)}
              </span>
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-tenant-primary/10 px-3 py-1.5 text-xs font-bold text-tenant-primary">
          {student.course}
        </span>
      </header>

      {student.installments.length === 0 || payableInstallments.length === 0 ? (
        <div className="flex items-center gap-3 px-5 py-8">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle className="h-6 w-6" aria-hidden />
          </div>
          <p className="text-sm font-semibold text-slate-700 sm:text-base">
            ¡Todo al día! No hay deudas pendientes para este alumno
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="hidden min-w-[760px] grid-cols-[56px_1fr_150px_130px_140px] border-b border-slate-100 bg-white px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-slate-500 md:grid">
            <span />
            <span>Mensualidad</span>
            <span>Vencimiento</span>
            <span>Estado</span>
            <span className="text-right">Monto</span>
          </div>

          {student.installments.map((installment) => (
            <InstallmentRow
              key={installment.id}
              installment={installment}
              isSelected={selectedCuotas.includes(installment.id)}
              isCreatingTransaction={isCreatingTransaction}
              onToggleInstallment={onToggleInstallment}
            />
          ))}
        </div>
      )}
    </article>
  );
}

function InstallmentRow({
  installment,
  isSelected,
  isCreatingTransaction,
  onToggleInstallment,
}: {
  installment: Installment;
  isSelected: boolean;
  isCreatingTransaction: boolean;
  onToggleInstallment: (installment: Installment) => void;
}) {
  const isPaid = installment.status === "PAGADO";

  return (
    <label
      className={`block border-b border-slate-100 px-4 py-4 transition last:border-none md:grid md:min-w-[760px] md:grid-cols-[56px_1fr_150px_130px_140px] md:items-center md:gap-3 ${
        isPaid
          ? "cursor-not-allowed bg-slate-50 opacity-60"
          : "cursor-pointer bg-white hover:bg-slate-50"
      }`}
    >
      <span className="hidden items-center md:flex">
        <InstallmentCheckbox
          installment={installment}
          isSelected={isSelected}
          isCreatingTransaction={isCreatingTransaction}
          onToggleInstallment={onToggleInstallment}
        />
      </span>
      <span className="hidden md:block">
        <span className="block font-bold text-slate-950">
          {installment.month}
        </span>
        <span className="text-sm text-slate-500">Mensualidad escolar</span>
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
          <InstallmentCheckbox
            installment={installment}
            isSelected={isSelected}
            isCreatingTransaction={isCreatingTransaction}
            onToggleInstallment={onToggleInstallment}
            mobile
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
}

function InstallmentCheckbox({
  installment,
  isSelected,
  isCreatingTransaction,
  onToggleInstallment,
  mobile = false,
}: {
  installment: Installment;
  isSelected: boolean;
  isCreatingTransaction: boolean;
  onToggleInstallment: (installment: Installment) => void;
  mobile?: boolean;
}) {
  const isPaid = installment.status === "PAGADO";

  return (
    <input
      type="checkbox"
      checked={isSelected}
      disabled={isPaid || isCreatingTransaction}
      onChange={() => onToggleInstallment(installment)}
      className={`${mobile ? "mt-1" : ""} h-5 w-5 rounded border-slate-300 text-tenant-primary accent-tenant-primary disabled:cursor-not-allowed`}
    />
  );
}

function StudentIcon() {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] bg-tenant-primary/10 text-tenant-primary">
      <GraduationCap className="h-5 w-5" aria-hidden />
    </div>
  );
}

function EmptyStudents() {
  return (
    <div className="rounded-[8px] border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
      <GraduationCap
        className="mx-auto h-10 w-10 text-slate-300"
        aria-hidden
      />
      <p className="mt-4 font-bold text-slate-700">
        No hay alumnos vinculados a esta cuenta.
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: InstallmentStatus }) {
  const current = statusCopy[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${current.className}`}
    >
      <span className={`h-2 w-2 rounded-full ${current.dotClassName}`} />
      {current.label}
    </span>
  );
}

function PaymentBar({
  isVisible,
  selectedCount,
  selectedTotal,
  isCreatingTransaction,
  onStartWebpayTransaction,
}: {
  isVisible: boolean;
  selectedCount: number;
  selectedTotal: number;
  isCreatingTransaction: boolean;
  onStartWebpayTransaction: () => void;
}) {
  return (
    <div
      aria-hidden={!isVisible}
      className={`fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-all duration-300 ease-out lg:left-72 ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-full opacity-0"
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-end justify-between gap-6 sm:justify-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              {selectedCount} {selectedCount === 1 ? "cuota" : "cuotas"}{" "}
              {selectedCount === 1 ? "seleccionada" : "seleccionadas"}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              Total a pagar
            </p>
          </div>
          <p className="text-3xl font-black tracking-tight text-tenant-primary sm:text-4xl">
            {formatCurrency(selectedTotal)}
          </p>
        </div>

        <button
          type="button"
          disabled={selectedTotal === 0 || isCreatingTransaction}
          onClick={onStartWebpayTransaction}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-tenant-primary px-6 text-base font-bold text-white shadow-lg shadow-tenant-primary/20 transition hover:bg-tenant-primary/90 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none sm:w-auto sm:min-w-56"
        >
          {isCreatingTransaction ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <CreditCard className="h-5 w-5" aria-hidden />
          )}
          {isCreatingTransaction ? "Creando transacción" : "Pagar con Webpay"}
        </button>
      </div>
    </div>
  );
}

export function getDebt(installments: Installment[]) {
  return installments
    .filter((installment) => installment.status !== "PAGADO")
    .reduce((total, installment) => total + installment.amount, 0);
}
