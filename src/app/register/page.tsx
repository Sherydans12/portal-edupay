"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
  UserPlus,
} from "lucide-react";
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
    <main className="relative min-h-dvh overflow-hidden bg-tenant-primary">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-44 -top-60 h-[38rem] w-[38rem] rounded-full border-[104px] border-white/[0.035]" />
        <div className="absolute -bottom-80 -left-24 h-[38rem] w-[52rem] -rotate-6 rounded-[50%] bg-[#17316f]" />
        <div className="absolute -right-28 -top-32 h-[26rem] w-[26rem] rounded-full bg-tenant-secondary" />
        <div className="absolute right-[13%] top-[11%] h-28 w-28 rounded-full border-[22px] border-white/10" />
        <div className="absolute bottom-[8%] right-[42%] h-3 w-24 rotate-[-18deg] rounded-full bg-tenant-secondary/75" />
      </div>

      <section className="relative mx-auto grid min-h-dvh w-full max-w-7xl items-start gap-10 px-4 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-12 lg:py-10">
        <div className="hidden lg:flex lg:min-h-[38rem] lg:flex-col lg:justify-between lg:py-8">
          <BrandLogo inverse />

          <div className="max-w-xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-tenant-secondary">
              Primer acceso
            </p>
            <h1 className="mt-5 text-5xl font-black leading-[1.05] tracking-[-0.03em] text-white xl:text-6xl">
              Activa tu cuenta de apoderado con validación EduPay.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-blue-100">
              Solo los RUT registrados en la institución pueden crear una
              contraseña para entrar al portal.
            </p>
          </div>

          <div className="flex max-w-md items-center gap-4 border-t border-white/15 pt-6 text-sm leading-6 text-blue-100">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-tenant-secondary">
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </span>
            <p>Activación disponible para apoderados registrados.</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-[#fff9e9] p-5 shadow-[0_30px_90px_-34px_rgba(2,10,37,0.95)] sm:p-8"
        >
          <div
            className="absolute inset-x-0 top-0 h-1.5 bg-tenant-secondary"
            aria-hidden
          />
          <div
            className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-tenant-secondary/15"
            aria-hidden
          />

          <div className="relative mb-7 flex justify-center pt-2 lg:hidden">
            <BrandLogo />
          </div>

          <div className="relative mb-7">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#875900]">
              Acceso apoderados
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.025em] text-tenant-primary">
              Crear contraseña
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Ingresa tus datos para activar el primer acceso al portal.
            </p>
          </div>

          <label
            htmlFor="register-rut"
            className="relative block text-sm font-bold text-slate-700"
          >
            RUT del apoderado
            <span className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-[#8a93ad] bg-white/80 px-3 transition focus-within:border-tenant-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-tenant-primary/10">
              <UserRound className="h-5 w-5 text-tenant-primary/45" aria-hidden />
              <input
                id="register-rut"
                name="rut"
                value={rut}
                onChange={(event) => setRut(event.target.value)}
                placeholder="12.345.678-9"
                autoComplete="username"
                required
                className="h-full w-full bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-500"
              />
            </span>
          </label>

          <label
            htmlFor="register-email"
            className="relative mt-5 block text-sm font-bold text-slate-700"
          >
            Email
            <span className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-[#8a93ad] bg-white/80 px-3 transition focus-within:border-tenant-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-tenant-primary/10">
              <Mail className="h-5 w-5 text-tenant-primary/45" aria-hidden />
              <input
                id="register-email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="correo@ejemplo.cl"
                autoComplete="email"
                required
                type="email"
                className="h-full w-full bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-500"
              />
            </span>
          </label>

          <label
            htmlFor="register-password"
            className="relative mt-5 block text-sm font-bold text-slate-700"
          >
            Contraseña
            <span className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-[#8a93ad] bg-white/80 px-3 transition focus-within:border-tenant-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-tenant-primary/10">
              <LockKeyhole className="h-5 w-5 text-tenant-primary/45" aria-hidden />
              <input
                id="register-password"
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                minLength={8}
                required
                type="password"
                className="h-full w-full bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-500"
              />
            </span>
            <span className="mt-2 block text-xs font-medium text-slate-600">
              Usa al menos 8 caracteres, incluyendo una letra y un número.
            </span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="relative mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-tenant-primary px-4 text-base font-bold text-white shadow-[0_12px_28px_-14px_rgba(20,34,76,0.9)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#10215f] hover:shadow-[0_16px_32px_-14px_rgba(20,34,76,0.95)] focus:outline-none focus:ring-4 focus:ring-tenant-primary/20 disabled:cursor-wait disabled:translate-y-0 disabled:bg-slate-400 disabled:shadow-none"
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
            className="relative mt-6 block rounded-lg text-center text-sm font-bold text-tenant-primary transition hover:text-[#10215f] focus:outline-none focus:ring-4 focus:ring-tenant-primary/10"
          >
            Ya tengo cuenta
          </Link>
        </form>
      </section>
    </main>
  );
}
