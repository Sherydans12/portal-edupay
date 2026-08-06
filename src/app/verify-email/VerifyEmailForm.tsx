"use client";

import { CheckCircle2, Loader2, MailCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";

type VerificationState =
  | { status: "idle"; message: string }
  | { status: "loading"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function VerifyEmailForm({ token }: { token: string }) {
  const [state, setState] = useState<VerificationState>({
    status: "idle",
    message: token
      ? "Confirma que deseas usar esta dirección en tu cuenta."
      : "El enlace no incluye una confirmación válida.",
  });

  async function confirmEmail() {
    setState({
      status: "loading",
      message: "Estamos actualizando tu información institucional.",
    });

    try {
      const response = await fetch("/api/account/email-change/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "No pudimos confirmar el correo. Tu dirección anterior sigue vigente.",
        );
      }

      setState({
        status: "success",
        message: data?.message ?? "Tu correo fue actualizado correctamente.",
      });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "No pudimos confirmar el correo. Tu dirección anterior sigue vigente.",
      });
    }
  }

  const isSuccess = state.status === "success";
  const isError = state.status === "error" || !token;

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl items-center">
        <div className="w-full overflow-hidden rounded-[16px] bg-white shadow-[0_24px_70px_rgba(20,34,76,0.14)]">
          <div className="h-2 bg-tenant-secondary" />
          <div className="border-b border-slate-200 px-6 py-5 sm:px-9">
            <BrandLogo />
          </div>
          <div
            className="px-6 py-9 text-center sm:px-9 sm:py-11"
            aria-live="polite"
            aria-busy={state.status === "loading"}
          >
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-[14px] ${
                isSuccess
                  ? "bg-emerald-50 text-emerald-700"
                  : isError
                    ? "bg-red-50 text-red-700"
                    : "bg-tenant-primary/8 text-tenant-primary"
              }`}
            >
              {state.status === "loading" ? (
                <Loader2 className="h-7 w-7 animate-spin" aria-hidden />
              ) : isSuccess ? (
                <CheckCircle2 className="h-7 w-7" aria-hidden />
              ) : isError ? (
                <XCircle className="h-7 w-7" aria-hidden />
              ) : (
                <MailCheck className="h-7 w-7" aria-hidden />
              )}
            </div>

            <h1 className="mt-6 text-2xl font-black tracking-[-0.02em] text-tenant-primary sm:text-3xl">
              {isSuccess
                ? "Correo confirmado"
                : isError
                  ? "No pudimos confirmar"
                  : "Confirmar nuevo correo"}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600 sm:text-base">
              {state.message}
            </p>

            {state.status === "idle" && token ? (
              <button
                type="button"
                onClick={() => void confirmEmail()}
                className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-tenant-primary px-5 text-base font-black text-white transition hover:bg-tenant-primary/92 focus:outline-none focus:ring-4 focus:ring-tenant-primary/20"
              >
                <MailCheck className="h-5 w-5" aria-hidden />
                Confirmar correo electrónico
              </button>
            ) : null}

            {state.status === "loading" ? (
              <button
                type="button"
                disabled
                className="mt-7 inline-flex h-12 w-full cursor-wait items-center justify-center gap-2 rounded-[8px] bg-slate-300 px-5 text-base font-black text-white"
              >
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Confirmando
              </button>
            ) : null}

            {isSuccess || isError ? (
              <Link
                href={isSuccess ? "/?section=profile" : "/login"}
                className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-[8px] bg-tenant-primary px-5 text-base font-black text-white transition hover:bg-tenant-primary/92 focus:outline-none focus:ring-4 focus:ring-tenant-primary/20"
              >
                {isSuccess ? "Volver a Mi cuenta" : "Volver al portal"}
              </Link>
            ) : null}
          </div>
          <p className="border-t border-slate-200 px-6 py-5 text-center text-xs leading-5 text-slate-500">
            Colegio Particular Conquistadores · Aprender con alegría
          </p>
        </div>
      </section>
    </main>
  );
}
