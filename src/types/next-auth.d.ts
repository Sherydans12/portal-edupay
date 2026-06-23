import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tenantId: string;
      rut: string;
    } & DefaultSession["user"];
  }

  interface User {
    tenantId: string;
    rut: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    tenantId: string;
    rut: string;
  }
}
