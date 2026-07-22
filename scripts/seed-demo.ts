import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
const tenantName = process.env.DEMO_TENANT_NAME ?? "Colegio Pruebas";
const tenantDomain =
  process.env.DEMO_TENANT_DOMAIN ?? `${tenantId ?? "colegio-pruebas"}.edupay.cl`;

async function main() {
  if (!tenantId) {
    throw new Error("NEXT_PUBLIC_TENANT_ID debe estar definido para seed-demo.");
  }

  console.log(`Iniciando seed demo para tenant ${tenantId}...`);

  const [adminPassword, guardianPassword] = await Promise.all([
    bcrypt.hash("base2026", 10),
    bcrypt.hash("demo123", 10),
  ]);

  const tenant = await prisma.tenant.upsert({
    where: { id: tenantId },
    update: {
      name: tenantName,
      isActive: true,
    },
    create: {
      id: tenantId,
      name: tenantName,
      domain: tenantDomain,
      logoUrl: "/logo.png",
      themeColors: {
        primary: "#1a2779",
        secondary: "#e8b04d",
        background: "#ffffff",
      },
      isActive: true,
    },
  });

  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@baselogic.cl" },
    update: {
      name: "BaseLogic Admin",
      password: adminPassword,
      role: "SUPERADMIN",
    },
    create: {
      email: "admin@baselogic.cl",
      password: adminPassword,
      name: "BaseLogic Admin",
      role: "SUPERADMIN",
    },
  });

  const guardian = await prisma.guardianUser.upsert({
    where: {
      tenantId_rut: {
        tenantId: tenant.id,
        rut: "12.345.678-5",
      },
    },
    update: {
      email: "marcela.fuentes@example.com",
      passwordHash: guardianPassword,
    },
    create: {
      tenantId: tenant.id,
      rut: "12.345.678-5",
      email: "marcela.fuentes@example.com",
      passwordHash: guardianPassword,
    },
  });

  console.log(`Tenant activo: ${tenant.name} (${tenant.id})`);
  console.log(`Super Admin listo: ${admin.email} / base2026`);
  console.log(`Apoderado listo: ${guardian.rut} / demo123`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
