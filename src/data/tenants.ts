export interface TenantConfig {
  id: string;
  name: string;
  domain: string;
  logoUrl: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
  };
}

export const tenants: Record<string, TenantConfig> = {
  conquistadores: {
    id: "tenant_01",
    name: "Colegio Conquistadores",
    domain: "conquistadores.edupay.cl",
    logoUrl: "/logo.png",
    colors: {
      primary: "#1a2779",
      secondary: "#e8b04d",
      background: "#ffffff",
    },
  },
};
