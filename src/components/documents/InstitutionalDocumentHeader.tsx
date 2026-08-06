import type { ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";

type InstitutionalDocumentHeaderProps = {
  documentType: string;
  reference?: string;
  action?: ReactNode;
};

export function InstitutionalDocumentHeader({
  documentType,
  reference,
  action,
}: InstitutionalDocumentHeaderProps) {
  return (
    <header className="institutional-document-header border-b border-slate-200 bg-white px-6 py-5 sm:px-8">
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0">
          <BrandLogo />
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-slate-500">
            <span>{documentType}</span>
            {reference && (
              <>
                <span className="h-1 w-1 rounded-full bg-tenant-secondary" aria-hidden />
                <span className="break-all">{reference}</span>
              </>
            )}
          </div>
        </div>
        {action}
      </div>
    </header>
  );
}
