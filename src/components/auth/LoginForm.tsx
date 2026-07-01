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
      toast.error("Credenciales incorrectas");
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
    <main className="min-h-screen bg-tenant-bg px-4 py-8">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden lg:block">
          <BrandLogo />
          <div className="mt-12 max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-tenant-secondary">
              Portal de Pagos
            </p>
            <h1 className="mt-4 text-5xl font-black leading-tight text-tenant-primary">
              Una experiencia clara para revisar y pagar mensualidades.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Consulta tu estado de cuenta institucional y paga de forma segura
              con Transbank Webpay Plus.
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
              Acceso seguro
            </p>
            <h2 className="mt-3 text-3xl font-black text-tenant-primary">
              Iniciar sesión
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Ingresa como apoderado o miembro autorizado del equipo.
            </p>
          </div>

          <label className="block text-sm font-semibold text-slate-700">
            RUT o correo electrónico
            <span className="mt-2 flex h-12 items-center gap-3 rounded-[8px] border border-slate-200 bg-slate-50 px-3 focus-within:border-tenant-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-tenant-primary/10">
              <UserRound className="h-5 w-5 text-slate-400" aria-hidden />
              <input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="12.345.678-9 o nombre@empresa.cl"
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
                placeholder="Tu contraseña"
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
              <ShieldCheck className="h-5 w-5" aria-hidden />
            )}
            {isSubmitting ? "Validando acceso" : "Entrar al portal"}
          </button>

          <div className="mt-6 space-y-3 text-center text-sm font-bold">
            <Link
              href="/register"
              className="block text-tenant-primary transition hover:text-tenant-primary/80"
            >
              ¿Primer acceso? Crea tu contraseña aquí
            </Link>
            <Link
              href="/forgot-password"
              className="block text-slate-600 transition hover:text-tenant-primary"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

        </form>
      </section>
    </main>
  );
}
