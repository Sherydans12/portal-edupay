"use client";

import Image from "next/image";
import { useState } from "react";
import { tenants } from "@/data/tenants";

type BrandLogoProps = {
  compact?: boolean;
  inverse?: boolean;
};

export function BrandLogo({ compact = false, inverse = false }: BrandLogoProps) {
  const [imageError, setImageError] = useState(false);
  const currentTenant = tenants["conquistadores"];

  return (
    <div className="flex items-center gap-3">
      {!imageError ? (
        <Image
          src={currentTenant.logoUrl}
          alt={`Logo ${currentTenant.name}`}
          width={compact ? 42 : 64}
          height={compact ? 42 : 64}
          priority
          className={`${compact ? "h-10 w-10" : "h-14 w-14"} object-contain`}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-tenant-primary text-sm font-black text-white sm:h-12 sm:w-12">
          CC
        </div>
      )}
      {!compact && (
        <div className="leading-tight">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-tenant-secondary">
            Colegio
          </p>
          <p
            className={`text-lg font-black ${inverse ? "text-white" : "text-tenant-primary"}`}
          >
            Conquistadores
          </p>
        </div>
      )}
    </div>
  );
}
