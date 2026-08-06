"use client";

import {
  BadgeCheck,
  CircleAlert,
  Download,
  FileBadge2,
  FileCheck2,
  GraduationCap,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { generateCertificate } from "@/lib/pdfGenerator";
import type { Student } from "@/types/payments";

type CertificatesManagerProps = {
  students: Student[];
  guardianRut: string;
};

type CertificateType = "ALUMNO_REGULAR" | "DEUDA_CERO";

const tenantName = "Colegio Conquistadores";

export function CertificatesManager({
  students,
  guardianRut,
}: CertificatesManagerProps) {
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);

  async function handleGenerate(
    type: CertificateType,
    student: Student,
  ) {
    const key = `${student.id}-${type}`;
    setGeneratingKey(key);

    try {
      await generateCertificate(
        type,
        student.name,
        student.course,
        guardianRut,
        tenantName,
      );
      toast.success("Certificado institucional descargado");
    } catch {
      toast.error("No pudimos generar el certificado. Intenta nuevamente.");
    } finally {
      setGeneratingKey(null);
    }
  }

  return (
    <section>
      <header>
        <h1 className="text-3xl font-black tracking-[-0.03em] text-tenant-primary sm:text-4xl">
          Certificados y documentos
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          Emite documentos institucionales para cada estudiante, listos para
          descargar, imprimir o presentar cuando los necesites.
        </p>
      </header>

      <div className="mt-6 flex items-start gap-3 rounded-[14px] border border-tenant-primary/10 bg-[#f4f6fb] px-4 py-4 sm:px-5">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-tenant-primary" aria-hidden />
        <div>
          <h2 className="font-black text-tenant-primary">
            Documentos con identidad institucional
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            Todos incluyen el logo del colegio, fecha de emisión e identificador
            de documento. El certificado de deuda cero se habilita cuando el
            estudiante no mantiene cuotas pendientes.
          </p>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="mt-6 rounded-[14px] border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
          <FileBadge2 className="mx-auto h-10 w-10 text-slate-300" aria-hidden />
          <h2 className="mt-4 font-black text-tenant-primary">
            No hay estudiantes vinculados
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Los documentos estarán disponibles cuando exista una matrícula
            asociada a esta cuenta.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {students.map((student) => {
            const hasDebt = student.installments.some(
              (installment) => installment.status !== "PAGADO",
            );

            return (
              <article
                key={student.id}
                className="overflow-hidden rounded-[14px] border border-slate-200 bg-white"
              >
                <header className="flex flex-col gap-3 border-b border-slate-200 bg-[#fbfcff] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] bg-tenant-primary/8 text-tenant-primary">
                      <GraduationCap className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <h2 className="font-black text-tenant-primary">
                        {student.name}
                      </h2>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {student.course} · Cuenta {student.accountNumber}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ${
                      hasDebt
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {hasDebt ? (
                      <CircleAlert className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {hasDebt ? "Con cuotas pendientes" : "Situación regularizada"}
                  </span>
                </header>

                <div className="divide-y divide-slate-100">
                  <CertificateRow
                    icon={FileCheck2}
                    title="Certificado de Alumno Regular"
                    description="Acredita la matrícula vigente y el curso actual del estudiante."
                    status="Disponible"
                    loading={
                      generatingKey === `${student.id}-ALUMNO_REGULAR`
                    }
                    disabled={generatingKey !== null}
                    onDownload={() =>
                      void handleGenerate("ALUMNO_REGULAR", student)
                    }
                  />
                  <CertificateRow
                    icon={FileBadge2}
                    title="Certificado de Deuda Cero"
                    description={
                      hasDebt
                        ? "Se habilitará cuando todas las cuotas del estudiante estén pagadas."
                        : "Acredita que no existen mensualidades pendientes a la fecha de emisión."
                    }
                    status={hasDebt ? "No disponible" : "Disponible"}
                    loading={generatingKey === `${student.id}-DEUDA_CERO`}
                    disabled={hasDebt || generatingKey !== null}
                    warning={hasDebt}
                    onDownload={() => void handleGenerate("DEUDA_CERO", student)}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function CertificateRow({
  icon: Icon,
  title,
  description,
  status,
  loading,
  disabled,
  warning = false,
  onDownload,
}: {
  icon: typeof FileCheck2;
  title: string;
  description: string;
  status: string;
  loading: boolean;
  disabled: boolean;
  warning?: boolean;
  onDownload: () => void;
}) {
  return (
    <div className="grid gap-4 px-5 py-5 md:grid-cols-[1fr_auto] md:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border border-slate-200 bg-white text-tenant-primary">
          <Icon className="h-4.5 w-4.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-slate-950">{title}</h3>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                warning
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {status}
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={onDownload}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-tenant-primary px-5 text-sm font-black text-white transition hover:bg-tenant-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tenant-primary disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 md:w-44"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Download className="h-4 w-4" aria-hidden />
        )}
        {loading ? "Generando" : "Descargar PDF"}
      </button>
    </div>
  );
}
