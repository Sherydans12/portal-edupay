"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, KeyRound, Loader2, Search } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier }),
    });

    const data = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      toast.error(data.error ?? "No fue posible iniciar la recuperación");
      return;
    }

    toast.success("Revisa las instrucciones de recuperación");
  }

  return (
    <main className="min-h-screen bg-tenant-bg px-4 py-8">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden lg:block">
          <BrandLogo />
          <div className="mt-12 max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-tenant-secondary">
              Recuperación
            </p>
            <h1 className="mt-4 text-5xl font-black leading-tight text-tenant-primary">
              Recupera el acceso al portal de pagos.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Buscaremos tu cuenta por RUT o email y generaremos un enlace de
              recuperación temporal.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mx-auto w-full max-w-md rounded-[8px] border border-slate-200 bg-white p-6 shadow-2xl shadow-tenant-primary/10 sm:p-8"
        >
          <div className="mb-8 flex justify-center lg:hidden">
            <BrandLogo />
          </div>
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-tenant-secondary">
              Acceso apoderados
            </p>
            <h2 className="mt-3 text-3xl font-black text-tenant-primary">
              Olvidé mi contraseña
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Ingresa tu RUT o email registrado.
            </p>
          </div>

          <label className="block text-sm font-semibold text-slate-700">
            RUT o Email
            <span className="mt-2 flex h-12 items-center gap-3 rounded-[8px] border border-slate-200 bg-slate-50 px-3 focus-within:border-tenant-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-tenant-primary/10">
              <Search className="h-5 w-5 text-slate-400" aria-hidden />
              <input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="12.345.678-9 o correo@ejemplo.cl"
                required
                className="h-full w-full bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-400"
              />
            </span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-tenant-primary px-4 text-base font-bold text-white shadow-lg shadow-tenant-primary/20 transition hover:bg-tenant-primary/90 focus:outline-none focus:ring-4 focus:ring-tenant-primary/20 disabled:cursor-wait disabled:bg-slate-400 disabled:shadow-none"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <KeyRound className="h-5 w-5" aria-hidden />
            )}
            {isSubmitting ? "Generando enlace" : "Recuperar contraseña"}
          </button>

          <Link
            href="/login"
            className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-tenant-primary transition hover:text-tenant-primary/80"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Volver al login
          </Link>
        </form>
      </section>
    </main>
  );
}
