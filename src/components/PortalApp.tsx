"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
  AccountStatement,
  StudentSelector,
  getDebt,
} from "@/components/dashboard/AccountStatement";
import { CertificatesManager } from "@/components/dashboard/CertificatesManager";
import { PaymentHistory } from "@/components/dashboard/PaymentHistory";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import type { EdupayStatementResponse } from "@/lib/edupay";
import type { Guardian, Installment } from "@/types/payments";
import type { ActiveSection } from "@/types/portal";

type PortalAppProps = {
  statement: EdupayStatementResponse;
};

export function PortalApp({ statement }: PortalAppProps) {
  const guardian: Guardian = {
    ...statement.guardian,
    students: statement.students,
  };
  const { status } = useSession();
  const [activeSection, setActiveSection] = useState<ActiveSection>("account");
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    guardian.students[0]?.id ?? "",
  );
  const [selectedCuotas, setSelectedCuotas] = useState<number[]>([]);
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false);

  const selectedStudent =
    guardian.students.find((student) => student.id === selectedStudentId) ??
    guardian.students[0];

  function resetPaymentFlow() {
    setSelectedCuotas([]);
    setIsCreatingTransaction(false);
  }

  function handleSelectStudent(studentId: string) {
    setSelectedStudentId(studentId);
  }

  function toggleInstallment(installment: Installment) {
    if (installment.status === "PAGADO" || isCreatingTransaction) {
      return;
    }

    setSelectedCuotas((current) =>
      current.includes(installment.id)
        ? current.filter((id) => id !== installment.id)
        : [...current, installment.id],
    );
  }

  async function startWebpayTransaction() {
    if (isCreatingTransaction) {
      return;
    }

    const selectedInstallments = guardian.students
      .flatMap((student) => student.installments)
      .filter(
        (installment) =>
          installment.status !== "PAGADO" &&
          selectedCuotas.includes(installment.id),
      );
    const selectedTotal = getDebt(selectedInstallments);

    if (selectedTotal === 0) {
      return;
    }

    setIsCreatingTransaction(true);

    try {
      const response = await fetch("/api/webpay/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: selectedTotal,
          sessionId: `portal-multi-${Date.now()}`,
          edupayPayload: selectedInstallments.map((installment) => installment.id),
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo iniciar el pago");
      }

      const payload = (await response.json()) as {
        url: string;
        token: string;
      };

      const form = document.createElement("form");
      form.method = "POST";
      form.action = payload.url;
      form.style.display = "none";

      const tokenInput = document.createElement("input");
      tokenInput.type = "hidden";
      tokenInput.name = "token_ws";
      tokenInput.value = payload.token;
      form.appendChild(tokenInput);

      document.body.appendChild(form);
      form.submit();
    } catch {
      setIsCreatingTransaction(false);
      toast.error("No se pudo iniciar el pago con Webpay. Intenta nuevamente.");
    }
  }

  function handleLogout() {
    setSelectedStudentId(guardian.students[0]?.id ?? "");
    setActiveSection("account");
    resetPaymentFlow();
    void signOut({ callbackUrl: "/login" });
  }

  if (status === "loading") {
    return <PortalSkeleton />;
  }

  return (
    <DashboardLayout
      guardian={guardian}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      onLogout={handleLogout}
    >
      <section className="mx-auto max-w-6xl">
        {activeSection === "account" && (
          <AccountStatement
            statement={statement}
            selectedCuotas={selectedCuotas}
            isCreatingTransaction={isCreatingTransaction}
            onToggleInstallment={toggleInstallment}
            onStartWebpayTransaction={startWebpayTransaction}
          />
        )}

        {selectedStudent && activeSection === "history" && (
          <>
            <StudentSelector
              students={guardian.students}
              selectedStudentId={selectedStudent.id}
              onSelectStudent={handleSelectStudent}
            />
            <PaymentHistory student={selectedStudent} />
          </>
        )}

        {activeSection === "certificates" && (
          <CertificatesManager
            students={guardian.students}
            guardianRut={guardian.rut}
          />
        )}
      </section>
    </DashboardLayout>
  );
}

function PortalSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white px-6 py-6 lg:block">
        <div className="h-12 w-44 animate-pulse rounded-md bg-tenant-primary/15" />
        <div className="mt-10 space-y-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-11 w-full animate-pulse rounded-md bg-slate-200"
            />
          ))}
        </div>
        <div className="absolute bottom-6 left-6 right-6 space-y-3 rounded-[8px] border border-slate-200 bg-slate-50 p-4">
          <div className="h-3 w-20 animate-pulse rounded-md bg-slate-200" />
          <div className="h-4 w-36 animate-pulse rounded-md bg-tenant-primary/15" />
          <div className="h-4 w-28 animate-pulse rounded-md bg-slate-200" />
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:ml-72 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="h-10 w-36 animate-pulse rounded-md bg-tenant-primary/15" />
          <div className="h-10 w-24 animate-pulse rounded-md bg-slate-200" />
        </div>
      </header>

      <main className="px-3 pb-8 pt-5 sm:px-4 lg:ml-72 lg:px-8 lg:py-8">
        <section className="mx-auto max-w-6xl">
          <div className="mb-6">
            <div className="h-4 w-40 animate-pulse rounded-md bg-tenant-secondary/20" />
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {[0, 1].map((item) => (
                <div
                  key={item}
                  className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 animate-pulse rounded-md bg-tenant-primary/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 animate-pulse rounded-md bg-slate-200" />
                      <div className="h-3 w-1/3 animate-pulse rounded-md bg-slate-200" />
                    </div>
                    <div className="h-7 w-24 animate-pulse rounded-full bg-tenant-secondary/20" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="rounded-[8px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  <div className="h-4 w-36 animate-pulse rounded-md bg-tenant-secondary/20" />
                  <div className="h-8 w-56 animate-pulse rounded-md bg-tenant-primary/15" />
                  <div className="h-4 w-44 animate-pulse rounded-md bg-slate-200" />
                </div>
                <div className="h-20 w-full animate-pulse rounded-md bg-tenant-primary/15 sm:w-44" />
              </div>

              <div className="mt-6 rounded-[8px] border border-slate-200">
                <div className="hidden h-11 min-w-[760px] animate-pulse rounded-t-md bg-slate-100 md:block" />
                {[0, 1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="grid gap-3 border-t border-slate-100 px-4 py-4 md:grid-cols-[56px_1fr_150px_130px_140px]"
                  >
                    {[0, 1, 2, 3, 4].map((cell) => (
                      <div
                        key={cell}
                        className="h-5 animate-pulse rounded-md bg-slate-200"
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <aside className="h-fit rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="h-4 w-36 animate-pulse rounded-md bg-tenant-secondary/20" />
              <div className="mt-5 space-y-3">
                <div className="h-16 animate-pulse rounded-md bg-slate-100" />
                <div className="h-16 animate-pulse rounded-md bg-slate-100" />
              </div>
              <div className="mt-6 h-12 animate-pulse rounded-md bg-tenant-primary/20" />
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
