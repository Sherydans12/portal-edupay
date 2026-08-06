"use client";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";

type AccountProfile = {
  name: string | null;
  rut: string;
  email: string | null;
  updatedAt: string | null;
  sourceStatus: "synced" | "cached";
  pendingEmail: string | null;
  pendingEmailExpiresAt: string | null;
};

type AccountSettingsProps = {
  fallbackName: string;
  fallbackRut: string;
  fallbackEmail?: string;
};

export function AccountSettings({
  fallbackName,
  fallbackRut,
  fallbackEmail = "",
}: AccountSettingsProps) {
  const [profile, setProfile] = useState<AccountProfile>({
    name: fallbackName,
    rut: fallbackRut,
    email: fallbackEmail || null,
    updatedAt: null,
    sourceStatus: "cached",
    pendingEmail: null,
    pendingEmailExpiresAt: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [email, setEmail] = useState(fallbackEmail);
  const [emailPassword, setEmailPassword] = useState("");
  const [isRequestingEmail, setIsRequestingEmail] = useState(false);
  const [developmentVerificationUrl, setDevelopmentVerificationUrl] =
    useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  async function loadProfile() {
    setIsRefreshing(true);

    try {
      const response = await fetch("/api/account/profile", {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        profile?: AccountProfile;
        error?: string;
      };

      if (!response.ok || !data.profile) {
        throw new Error(data.error ?? "No pudimos cargar tu información");
      }

      setProfile(data.profile);
      setEmail(data.profile.email ?? "");

      toast.success(
        data.profile.sourceStatus === "synced"
          ? "Información actualizada desde EduPay"
          : "Mostrando la última información disponible",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No pudimos cargar tu información",
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    let isCurrent = true;

    void fetch("/api/account/profile", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as {
          profile?: AccountProfile;
          error?: string;
        };

        if (!response.ok || !data.profile) {
          throw new Error(data.error ?? "No pudimos cargar tu información");
        }

        return data.profile;
      })
      .then((loadedProfile) => {
        if (!isCurrent) {
          return;
        }

        setProfile(loadedProfile);
        setEmail(loadedProfile.email ?? "");
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          toast.error(
            error instanceof Error
              ? error.message
              : "No pudimos cargar tu información",
          );
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  async function requestEmailChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsRequestingEmail(true);
    setDevelopmentVerificationUrl(null);

    try {
      const response = await fetch("/api/account/email-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, currentPassword: emailPassword }),
      });
      const data = (await response.json()) as {
        error?: string;
        pendingEmail?: string;
        expiresAt?: string;
        verificationUrl?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "No pudimos iniciar el cambio de correo");
      }

      setProfile((current) => ({
        ...current,
        pendingEmail: data.pendingEmail ?? email,
        pendingEmailExpiresAt: data.expiresAt ?? null,
      }));
      setEmailPassword("");
      setDevelopmentVerificationUrl(data.verificationUrl ?? null);
      toast.success("Enviamos una confirmación al correo nuevo");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No pudimos iniciar el cambio de correo",
      );
    } finally {
      setIsRequestingEmail(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas nuevas no coinciden");
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "No pudimos cambiar tu contraseña");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(data.message ?? "Contraseña actualizada");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No pudimos cambiar tu contraseña",
      );
    } finally {
      setIsChangingPassword(false);
    }
  }

  if (isLoading) {
    return <AccountSettingsSkeleton />;
  }

  const displayName = profile.name || fallbackName;
  const emailHasChanged =
    email.trim().toLowerCase() !== (profile.email ?? "").toLowerCase();
  const passwordIsReady =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(newPassword) &&
    /\d/.test(newPassword) &&
    newPassword === confirmPassword;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.025em] text-tenant-primary">
            Mi cuenta
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Revisa tus datos personales y administra el acceso al Portal de
            Pagos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadProfile()}
          disabled={isRefreshing}
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-[8px] border border-slate-200 bg-white px-3.5 text-sm font-bold text-slate-700 transition hover:border-tenant-primary/30 hover:text-tenant-primary focus:outline-none focus:ring-4 focus:ring-tenant-primary/10 disabled:cursor-wait disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            aria-hidden
          />
          Actualizar datos
        </button>
      </header>

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <section
          data-account-personal
          className="h-fit overflow-hidden rounded-[14px] bg-white shadow-[0_14px_40px_rgba(20,34,76,0.08)]"
        >
          <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div>
                <h2 className="text-xl font-black text-tenant-primary">
                  Información personal
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  El nombre y el RUT provienen directamente de EduPay.
                </p>
              </div>
              <span
                className={`inline-flex shrink-0 self-start items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                  profile.sourceStatus === "synced"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-800"
                }`}
              >
                {profile.sourceStatus === "synced" ? (
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden />
                )}
                {profile.sourceStatus === "synced"
                  ? "Sincronizado"
                  : "Última copia"}
              </span>
            </div>
          </div>

          <dl className="grid gap-0 px-5 sm:px-7">
            <div className="grid gap-1 border-b border-slate-100 py-5 sm:grid-cols-[150px_1fr] sm:items-center">
              <dt className="flex items-center gap-2 text-sm font-bold text-slate-500">
                <UserRound className="h-4 w-4 text-slate-400" aria-hidden />
                Nombre
              </dt>
              <dd className="font-extrabold text-slate-900">{displayName}</dd>
            </div>
            <div className="grid gap-1 border-b border-slate-100 py-5 sm:grid-cols-[150px_1fr] sm:items-center">
              <dt className="flex items-center gap-2 text-sm font-bold text-slate-500">
                <ShieldCheck className="h-4 w-4 text-slate-400" aria-hidden />
                RUT
              </dt>
              <dd>
                <span className="font-extrabold text-slate-900">
                  {profile.rut}
                </span>
                <span className="ml-2 text-xs font-semibold text-slate-400">
                  No editable
                </span>
              </dd>
            </div>
          </dl>

          <form
            onSubmit={requestEmailChange}
            className="px-5 pb-6 pt-5 sm:px-7 sm:pb-7"
          >
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 text-tenant-primary" aria-hidden />
              <div>
                <h3 className="font-black text-slate-900">
                  Correo electrónico
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Se utiliza para notificaciones y recuperación de acceso.
                </p>
              </div>
            </div>

            {profile.pendingEmail ? (
              <div
                className="mt-4 rounded-[10px] bg-[#fff8d9] p-4 text-sm text-[#67520a]"
                role="status"
              >
                <div className="flex gap-2.5">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <div>
                    <p className="font-extrabold">
                      Confirmación pendiente para {profile.pendingEmail}
                    </p>
                    <p className="mt-1 leading-5">
                      El correo actual seguirá vigente hasta que abras el enlace
                      enviado a la nueva dirección.
                    </p>
                    {developmentVerificationUrl ? (
                      <a
                        href={developmentVerificationUrl}
                        className="mt-3 inline-flex items-center gap-1.5 font-extrabold text-tenant-primary underline decoration-tenant-primary/30 underline-offset-4"
                      >
                        Abrir confirmación local
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {profile.sourceStatus === "cached" ? (
              <div
                className="mt-4 flex items-start gap-2.5 rounded-[10px] bg-amber-50 px-4 py-3 text-sm text-amber-900"
                role="status"
              >
                <AlertCircle
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden
                />
                <p className="leading-5">
                  EduPay no respondió. El cambio de correo se habilitará cuando
                  podamos comprobar nuevamente tus datos.
                </p>
              </div>
            ) : null}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold text-slate-700">
                Nuevo correo
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 h-12 w-full rounded-[8px] border border-slate-200 bg-slate-50 px-3.5 text-base font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-tenant-primary focus:bg-white focus:ring-4 focus:ring-tenant-primary/10"
                  placeholder="nombre@correo.cl"
                  required
                />
              </label>
              <label className="block text-sm font-bold text-slate-700">
                Contraseña actual
                <input
                  type="password"
                  autoComplete="current-password"
                  value={emailPassword}
                  onChange={(event) => setEmailPassword(event.target.value)}
                  className="mt-2 h-12 w-full rounded-[8px] border border-slate-200 bg-slate-50 px-3.5 text-base font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-tenant-primary focus:bg-white focus:ring-4 focus:ring-tenant-primary/10"
                  placeholder="Confirma tu identidad"
                  required
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-md text-xs font-medium leading-5 text-slate-500">
                Enviaremos un enlace al correo nuevo. No cambiaremos nada hasta
                que lo confirmes.
              </p>
              <button
                type="submit"
                disabled={
                  isRequestingEmail ||
                  profile.sourceStatus !== "synced" ||
                  !emailHasChanged ||
                  emailPassword.length === 0
                }
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[8px] bg-tenant-primary px-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-tenant-primary/92 focus:outline-none focus:ring-4 focus:ring-tenant-primary/20 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                {isRequestingEmail ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Mail className="h-4 w-4" aria-hidden />
                )}
                {isRequestingEmail
                  ? "Enviando confirmación"
                  : "Verificar nuevo correo"}
              </button>
            </div>
          </form>
        </section>

        <section
          data-account-security
          className="h-fit rounded-[14px] bg-tenant-primary p-5 text-white shadow-[0_16px_42px_rgba(20,34,76,0.18)] sm:p-7"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white/10">
            <KeyRound className="h-5 w-5 text-tenant-secondary" aria-hidden />
          </div>
          <h2 className="mt-5 text-xl font-black">Seguridad de la cuenta</h2>
          <p className="mt-2 text-sm leading-6 text-blue-100">
            Cambia tu contraseña sin modificar tus datos en EduPay.
          </p>

          <form onSubmit={changePassword} className="mt-6 space-y-4">
            <PasswordField
              label="Contraseña actual"
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
            />
            <PasswordField
              label="Nueva contraseña"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
            />
            <PasswordField
              label="Repetir nueva contraseña"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
            />

            <div className="space-y-2 pt-1 text-xs font-semibold text-blue-100">
              <PasswordRequirement
                met={newPassword.length >= 8}
                label="Al menos 8 caracteres"
              />
              <PasswordRequirement
                met={/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(newPassword) && /\d/.test(newPassword)}
                label="Incluye una letra y un número"
              />
              <PasswordRequirement
                met={confirmPassword.length > 0 && newPassword === confirmPassword}
                label="Ambas contraseñas coinciden"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPassword || !passwordIsReady}
              className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-tenant-secondary px-4 text-sm font-black text-tenant-primary transition hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-white/20 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/60"
            >
              {isChangingPassword ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <LockKeyhole className="h-4 w-4" aria-hidden />
              )}
              {isChangingPassword ? "Guardando" : "Cambiar contraseña"}
            </button>
          </form>
        </section>
      </div>

    </div>
  );
}

function PasswordField({
  autoComplete,
  label,
  onChange,
  value,
}: {
  autoComplete: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block text-sm font-bold text-white">
      {label}
      <input
        type="password"
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-[8px] border border-white/15 bg-white/10 px-3.5 text-base font-semibold text-white outline-none transition placeholder:text-blue-200 focus:border-tenant-secondary focus:bg-white/15 focus:ring-4 focus:ring-tenant-secondary/15"
        required
      />
    </label>
  );
}

function PasswordRequirement({ label, met }: { label: string; met: boolean }) {
  return (
    <p className="flex items-center gap-2">
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full ${
          met ? "bg-tenant-secondary text-tenant-primary" : "bg-white/15"
        }`}
      >
        {met ? <Check className="h-3 w-3" aria-hidden /> : null}
      </span>
      {label}
    </p>
  );
}

function AccountSettingsSkeleton() {
  return (
    <div className="mx-auto max-w-5xl" role="status" aria-label="Cargando cuenta">
      <div className="h-9 w-44 animate-pulse rounded-md bg-tenant-primary/15" />
      <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded-md bg-slate-200" />
      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <div className="h-[540px] animate-pulse rounded-[14px] bg-white shadow-sm" />
        <div className="h-[520px] animate-pulse rounded-[14px] bg-tenant-primary/20" />
      </div>
    </div>
  );
}
