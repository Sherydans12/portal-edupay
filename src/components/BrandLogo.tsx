"use client";

import Image from "next/image";
import { useState } from "react";
import { tenants } from "@/data/tenants";

type BrandLogoProps = {
  compact?: boolean;
};

export function BrandLogo({ compact = false }: BrandLogoProps) {
  const [imageError, setImageError] = useState(false);
  const currentTenant = tenants["conquistadores"];

  return (
    <div className="flex items-center gap-3">
      {!imageError ? (
        <Image
          src={currentTenant.logoUrl}
          alt={`Logo ${currentTenant.name}`}
          width={compact ? 38 : 56}
          height={compact ? 38 : 56}
          priority
          className="h-10 w-10 rounded-lg object-contain sm:h-12 sm:w-12"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-tenant-primary text-sm font-black text-white sm:h-12 sm:w-12">
          CC
        </div>
      )}
      {!compact && (
        <div className="leading-tight">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-tenant-secondary">
            Colegio
          </p>
          <p className="text-xl font-black text-tenant-primary">
            Conquistadores
          </p>
        </div>
      )}
    </div>
  );
}
