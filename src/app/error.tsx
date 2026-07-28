"use client";

import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function ErrorPage({ error, unstable_retry }: ErrorPageProps) {
  useEffect(() => {
    console.error("Error de renderizado del portal", {
      digest: error.digest,
      error,
    });
  }, [error]);

  return <ErrorContent onRetry={unstable_retry} />;
}

export function ErrorContent({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-900">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
          Portal de Pagos
        </p>
        <h1 className="mt-3 text-2xl font-bold">Ocurrió un problema</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          No pudimos completar esta acción. Tu información de pago no ha sido
          expuesta. Intenta nuevamente o vuelve al inicio.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            className="rounded-lg bg-teal-700 px-4 py-2.5 font-semibold text-white transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2"
            onClick={onRetry}
            type="button"
          >
            Reintentar
          </button>
          <a
            className="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2"
            href="/"
          >
            Volver al inicio
          </a>
        </div>
      </section>
    </main>
  );
}
