"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, LockKeyhole, Mail, UserRound, UserPlus } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export default function RegisterPage() {
  const router = useRouter();
  const [rut, setRut] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rut, email, password }),
    });

    const data = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      toast.error(data.error ?? "No fue posible crear la cuenta");
      return;
    }

    toast.success("Cuenta creada, por favor inicia sesión");
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-tenant-bg px-4 py-8">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden lg:block">
          <BrandLogo />
          <div className="mt-12 max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-tenant-secondary">
              Primer acceso
            </p>
            <h1 className="mt-4 text-5xl font-black leading-tight text-tenant-primary">
              Activa tu cuenta de apoderado con validación EduPay.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Solo los RUT registrados en la institución pueden crear una
              contraseña para entrar al portal.
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
              Crear contraseña
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Ingresa tus datos para activar el primer acceso al portal.
            </p>
          </div>

          <label className="block text-sm font-semibold text-slate-700">
            RUT del apoderado
            <span className="mt-2 flex h-12 items-center gap-3 rounded-[8px] border border-slate-200 bg-slate-50 px-3 focus-within:border-tenant-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-tenant-primary/10">
              <UserRound className="h-5 w-5 text-slate-400" aria-hidden />
              <input
                value={rut}
                onChange={(event) => setRut(event.target.value)}
                placeholder="12.345.678-9"
                required
                className="h-full w-full bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-400"
              />
            </span>
          </label>

          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Email
            <span className="mt-2 flex h-12 items-center gap-3 rounded-[8px] border border-slate-200 bg-slate-50 px-3 focus-within:border-tenant-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-tenant-primary/10">
              <Mail className="h-5 w-5 text-slate-400" aria-hidden />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="correo@ejemplo.cl"
                autoComplete="email"
                required
                type="email"
                className="h-full w-full bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-400"
              />
            </span>
          </label>

          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Contraseña
            <span className="mt-2 flex h-12 items-center gap-3 rounded-[8px] border border-slate-200 bg-slate-50 px-3 focus-within:border-tenant-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-tenant-primary/10">
              <LockKeyhole className="h-5 w-5 text-slate-400" aria-hidden />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
                type="password"
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
              <UserPlus className="h-5 w-5" aria-hidden />
            )}
            {isSubmitting ? "Validando RUT" : "Crear cuenta"}
          </button>

          <Link
            href="/login"
            className="mt-6 block text-center text-sm font-bold text-tenant-primary transition hover:text-tenant-primary/80"
          >
            Ya tengo cuenta
          </Link>
        </form>
      </section>
    </main>
  );
}
