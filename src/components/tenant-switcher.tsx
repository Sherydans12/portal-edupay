"use client";

import { Building2 } from "lucide-react";
import { useRouter } from "next/navigation";

export type TenantSwitcherOption = {
  id: string;
  name: string;
};

type TenantSwitcherProps = {
  activeTenantId?: string | null;
  tenants: TenantSwitcherOption[];
};

export function TenantSwitcher({
  activeTenantId,
  tenants,
}: TenantSwitcherProps) {
  const router = useRouter();

  function handleTenantChange(tenantId: string) {
    const params = new URLSearchParams();

    if (tenantId) {
      params.set("tenant", tenantId);
    }

    const queryString = params.toString();
    router.push(queryString ? `/admin?${queryString}` : "/admin");
  }

  return (
    <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
      <Building2 className="h-4 w-4 text-blue-600" aria-hidden />
      <span className="sr-only">Colegio activo</span>
      <select
        value={activeTenantId ?? ""}
        onChange={(event) => handleTenantChange(event.target.value)}
        className="min-w-48 bg-transparent font-bold text-slate-800 outline-none"
      >
        <option value="">Todos los colegios</option>
        {tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </select>
    </label>
  );
}
