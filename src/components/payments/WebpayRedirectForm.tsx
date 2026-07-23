"use client";

import { CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useRef } from "react";

type WebpayRedirectFormProps = {
  url?: string;
  tokenWs?: string;
};

export function WebpayRedirectForm({ url, tokenWs }: WebpayRedirectFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (url && tokenWs) {
      formRef.current?.submit();
    }
  }, [url, tokenWs]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label="Redirigiendo a Webpay"
    >
      <section className="w-full max-w-md overflow-hidden rounded-2xl border border-white/15 bg-white shadow-2xl shadow-slate-950/30">
        <div className="bg-tenant-primary px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <CreditCard className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">
                Pago seguro
              </p>
              <h2 className="mt-1 text-xl font-black">Conectando con Webpay</h2>
            </div>
          </div>
        </div>

        <div className="px-6 py-7 text-center">
          <Loader2
            className="mx-auto h-9 w-9 animate-spin text-tenant-primary"
            aria-hidden
          />
          <p className="mt-4 font-bold text-slate-900">
            Estamos preparando tu transacción
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            No cierres ni actualices esta ventana. Serás redirigido a la
            pasarela segura de Transbank.
          </p>

          <div className="mt-6 space-y-2" aria-hidden>
            <div className="h-2 w-full animate-pulse rounded-full bg-slate-200" />
            <div className="mx-auto h-2 w-3/4 animate-pulse rounded-full bg-slate-100" />
          </div>

          {url && tokenWs && (
            <form ref={formRef} method="POST" action={url} className="mt-6">
              <input type="hidden" name="token_ws" value={tokenWs} />
              <button
                type="submit"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-tenant-primary/20 bg-tenant-primary/5 px-4 text-sm font-bold text-tenant-primary transition hover:bg-tenant-primary/10"
              >
                Continuar a Webpay
              </button>
            </form>
          )}

          <p className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Conexión protegida por Transbank
          </p>
        </div>
      </section>
    </div>
  );
}
