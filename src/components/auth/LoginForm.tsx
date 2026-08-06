"use client";

import { Loader2, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { BrandLogo } from "@/components/BrandLogo";

type LoginFormProps = {
  onLogin?: () => void;
};

export function LoginForm({ onLogin }: LoginFormProps) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);

    const res = await signIn("credentials", {
      rut: identifier,
      password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (res?.error) {
      toast.error(
        res.error === "RateLimit" || res.status === 429
          ? "Demasiados intentos. Espera unos minutos antes de volver a intentar."
          : "Credenciales incorrectas",
      );
      return;
    }

    toast.success("Bienvenido");
    if (onLogin) {
      onLogin();
      return;
    }

    const session = await getSession();
    router.push(session?.user?.role === "SUPERADMIN" ? "/admin" : "/");
    router.refresh();
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
              Portal de Pagos
            </p>
            <h1 className="mt-5 text-5xl font-black leading-[1.05] tracking-[-0.03em] text-white xl:text-6xl">
              Una experiencia clara para revisar y pagar mensualidades.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-blue-100">
              Consulta tu estado de cuenta institucional y paga de forma segura
              con Transbank Webpay Plus.
            </p>
          </div>

          <div className="flex max-w-md items-center gap-4 border-t border-white/15 pt-6 text-sm leading-6 text-blue-100">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-tenant-secondary">
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </span>
            <p>
              Acceso institucional para apoderados y personal autorizado.
            </p>
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
              Acceso seguro
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.025em] text-tenant-primary">
              Iniciar sesión
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Ingresa como apoderado o miembro autorizado del equipo.
            </p>
          </div>

          <label
            htmlFor="login-identifier"
            className="relative block text-sm font-bold text-slate-700"
          >
            RUT o correo electrónico
            <span className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-[#8a93ad] bg-white/80 px-3 transition focus-within:border-tenant-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-tenant-primary/10">
              <UserRound className="h-5 w-5 text-tenant-primary/45" aria-hidden />
              <input
                id="login-identifier"
                name="identifier"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="12.345.678-9 o nombre@empresa.cl"
                autoComplete="username"
                required
                className="h-full w-full bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-500"
              />
            </span>
            <span className="mt-2 block text-xs font-medium leading-5 text-slate-600">
              Si el correo es compartido por más de una cuenta, utiliza tu RUT.
            </span>
          </label>

          <label
            htmlFor="login-password"
            className="relative mt-5 block text-sm font-bold text-slate-700"
          >
            Contraseña
            <span className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-[#8a93ad] bg-white/80 px-3 transition focus-within:border-tenant-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-tenant-primary/10">
              <LockKeyhole className="h-5 w-5 text-tenant-primary/45" aria-hidden />
              <input
                id="login-password"
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Tu contraseña"
                type="password"
                autoComplete="current-password"
                required
                className="h-full w-full bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-500"
              />
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
              <ShieldCheck className="h-5 w-5" aria-hidden />
            )}
            {isSubmitting ? "Validando acceso" : "Entrar al portal"}
          </button>

          <div className="relative mt-6 space-y-3 text-center text-sm font-bold">
            <Link
              href="/register"
              className="block rounded-lg text-tenant-primary transition hover:text-[#10215f] focus:outline-none focus:ring-4 focus:ring-tenant-primary/10"
            >
              ¿Primer acceso? Crea tu contraseña aquí
            </Link>
            <Link
              href="/forgot-password"
              className="block rounded-lg text-slate-600 transition hover:text-tenant-primary focus:outline-none focus:ring-4 focus:ring-tenant-primary/10"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
