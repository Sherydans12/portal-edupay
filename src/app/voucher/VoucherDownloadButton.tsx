"use client";

import { Download } from "lucide-react";
import { generateReceipt } from "@/lib/pdfGenerator";

type VoucherDownloadButtonProps = {
  amount: number;
  buyOrder: string;
  authorizationCode: string | null;
  paymentDate: string;
  isAuthorized: boolean;
};

export function VoucherDownloadButton({
  amount,
  buyOrder,
  authorizationCode,
  paymentDate,
  isAuthorized,
}: VoucherDownloadButtonProps) {
  return (
    <button
      type="button"
      onClick={() =>
        generateReceipt(
          amount,
          buyOrder,
          authorizationCode,
          paymentDate,
          isAuthorized,
        )
      }
      className="flex h-12 w-full items-center justify-center gap-2 rounded-[8px] border border-tenant-primary/25 bg-white px-4 text-sm font-bold text-tenant-primary transition hover:border-tenant-primary hover:bg-tenant-primary/5"
    >
      <Download className="h-5 w-5" aria-hidden />
      Descargar PDF
    </button>
  );
}
