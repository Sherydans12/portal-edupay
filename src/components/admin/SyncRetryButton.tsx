"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export function SyncRetryButton({ buyOrder }: { buyOrder: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function retrySync() {
    setIsPending(true);

    try {
      const response = await fetch("/api/cron/sync-retry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ buyOrder }),
      });
      const result = (await response.json()) as {
        error?: string;
        success?: number;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "No se pudo sincronizar el pago");
      }

      toast.success("Pago sincronizado con EduPay");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo sincronizar el pago",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={retrySync}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-800 transition hover:bg-amber-100 disabled:cursor-wait disabled:opacity-60"
    >
      <RefreshCw
        className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`}
        aria-hidden
      />
      {isPending ? "Sincronizando" : "Forzar sincronización"}
    </button>
  );
}
