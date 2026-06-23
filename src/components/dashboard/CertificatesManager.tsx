"use client";

import { Download, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { generateCertificate } from "@/lib/pdfGenerator";
import type { Student } from "@/types/payments";

type CertificatesManagerProps = {
  students: Student[];
  guardianRut: string;
};

const tenantName = "Colegio Conquistadores";

export function CertificatesManager({
  students,
  guardianRut,
}: CertificatesManagerProps) {
  return (
    <section className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-tenant-secondary">
        Certificados
      </p>
      <h1 className="mt-2 text-3xl font-black text-tenant-primary">
        Documentos para apoderados
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        El certificado de alumno regular está siempre disponible. El certificado
        de deuda cero se habilita cuando todas las cuotas del alumno están
        pagadas.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {students.map((student) => {
          const hasDebt = student.installments.some(
            (installment) => installment.status !== "PAGADO",
          );

          return (
            <div
              key={student.id}
              className="rounded-[8px] border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-tenant-primary/10 text-tenant-primary">
                  <FileText className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h2 className="font-black text-slate-950">{student.name}</h2>
                  <p className="text-sm text-slate-500">{student.course}</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    generateCertificate(
                      "ALUMNO_REGULAR",
                      student.name,
                      guardianRut,
                      tenantName,
                    );
                    toast.success("Certificado generado");
                  }}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-tenant-primary px-4 text-sm font-bold text-white transition hover:bg-tenant-primary/90"
                >
                  <Download className="h-4 w-4" aria-hidden />
                  Certificado de Alumno Regular
                </button>

                <button
                  type="button"
                  disabled={hasDebt}
                  onClick={() => {
                    generateCertificate(
                      "DEUDA_CERO",
                      student.name,
                      guardianRut,
                      tenantName,
                    );
                    toast.success("Certificado generado");
                  }}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-[8px] border border-tenant-primary/30 bg-white px-4 text-sm font-bold text-tenant-primary transition hover:bg-tenant-primary hover:text-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500"
                >
                  <Download className="h-4 w-4" aria-hidden />
                  Certificado de Deuda Cero
                </button>

                {hasDebt ? (
                  <p className="rounded-[8px] border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-800">
                    Debe regularizar su situación financiera para emitir este
                    documento.
                  </p>
                ) : (
                  <p className="rounded-[8px] border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold leading-5 text-emerald-700">
                    Situación financiera regularizada.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
