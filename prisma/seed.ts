import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── 1. Tenant ──────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { domain: "conquistadores.edupay.cl" },
    update: {},
    create: {
      name: "Colegio Conquistadores",
      domain: "conquistadores.edupay.cl",
      logoUrl: "/logo.png",
      themeColors: {
        primary: "#1a2779",
        secondary: "#e8b04d",
        background: "#ffffff",
      },
    },
  });

  console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`);

  // ── 2. Apoderados ──────────────────────────────────────────────
  const hash1 = await bcrypt.hash("demo123", 10);
  const hash2 = await bcrypt.hash("test456", 10);

  // Apoderado 1 – Marcela Fuentes (2 alumnos: Martina 3°Medio, Tomás 5°Básico)
  const guardian1 = await prisma.guardianUser.upsert({
    where: {
      tenantId_rut: { tenantId: tenant.id, rut: "12.345.678-9" },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      rut: "12.345.678-9",
      email: "marcela.fuentes@example.com",
      passwordHash: hash1,
    },
  });

  console.log(`✅ Apoderado 1: ${guardian1.rut} / contraseña: demo123`);

  // Apoderado 2 – Roberto Sánchez (1 alumno: Valentina 1°Básico)
  const guardian2 = await prisma.guardianUser.upsert({
    where: {
      tenantId_rut: { tenantId: tenant.id, rut: "11.111.111-1" },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      rut: "11.111.111-1",
      email: "roberto.sanchez@example.com",
      passwordHash: hash2,
    },
  });

  console.log(`✅ Apoderado 2: ${guardian2.rut} / contraseña: test456`);

  // ── 3. Transacciones de ejemplo ────────────────────────────────
  const transactions = [
    {
      tenantId: tenant.id,
      guardianId: guardian1.id,
      buyOrder: "OC-26030701",
      amount: 162000,
      status: "AUTHORIZED",
      authorizationCode: "AUTH-349821",
      edupayPayload: { installmentIds: ["mar-mar"] },
      edupaySynced: true,
    },
    {
      tenantId: tenant.id,
      guardianId: guardian1.id,
      buyOrder: "OC-26050802",
      amount: 162000,
      status: "AUTHORIZED",
      authorizationCode: "AUTH-572410",
      edupayPayload: { installmentIds: ["mar-may"] },
      edupaySynced: true,
    },
    {
      tenantId: tenant.id,
      guardianId: guardian1.id,
      buyOrder: "OC-26030503",
      amount: 138000,
      status: "AUTHORIZED",
      authorizationCode: "AUTH-840221",
      edupayPayload: { installmentIds: ["tom-mar"] },
      edupaySynced: true,
    },
    {
      tenantId: tenant.id,
      guardianId: guardian1.id,
      buyOrder: "OC-26040604",
      amount: 138000,
      status: "AUTHORIZED",
      authorizationCode: "AUTH-748133",
      edupayPayload: { installmentIds: ["tom-abr"] },
      edupaySynced: true,
    },
    {
      tenantId: tenant.id,
      guardianId: guardian1.id,
      buyOrder: "OC-26050605",
      amount: 138000,
      status: "AUTHORIZED",
      authorizationCode: "AUTH-984325",
      edupayPayload: { installmentIds: ["tom-may"] },
      edupaySynced: true,
    },
    {
      tenantId: tenant.id,
      guardianId: guardian2.id,
      buyOrder: "OC-26030901",
      amount: 125000,
      status: "AUTHORIZED",
      authorizationCode: "AUTH-112233",
      edupayPayload: { installmentIds: ["val-mar"] },
      edupaySynced: true,
    },
    {
      tenantId: tenant.id,
      guardianId: guardian2.id,
      buyOrder: "OC-26041002",
      amount: 125000,
      status: "AUTHORIZED",
      authorizationCode: "AUTH-445566",
      edupayPayload: { installmentIds: ["val-abr"] },
      edupaySynced: true,
    },
    {
      tenantId: tenant.id,
      guardianId: guardian2.id,
      buyOrder: "OC-26050903",
      amount: 125000,
      status: "AUTHORIZED",
      authorizationCode: "AUTH-778899",
      edupayPayload: { installmentIds: ["val-may"] },
      edupaySynced: true,
    },
    {
      tenantId: tenant.id,
      guardianId: guardian2.id,
      buyOrder: "OC-26060804",
      amount: 125000,
      status: "AUTHORIZED",
      authorizationCode: "AUTH-332211",
      edupayPayload: { installmentIds: ["val-jun"] },
      edupaySynced: true,
    },
  ];

  for (const tx of transactions) {
    await prisma.transaction.upsert({
      where: { buyOrder: tx.buyOrder },
      update: {},
      create: tx,
    });
  }

  console.log(`✅ ${transactions.length} transacciones de ejemplo creadas`);
  console.log("\n─────────────────────────────────────────────");
  console.log("  CREDENCIALES DE PRUEBA");
  console.log("─────────────────────────────────────────────");
  console.log("  Usuario 1: RUT 12.345.678-9 / Contraseña: demo123");
  console.log("    └─ Alumnos: Martina Fuentes (3°Medio) y Tomás Fuentes (5°Básico)");
  console.log("  Usuario 2: RUT 11.111.111-1 / Contraseña: test456");
  console.log("    └─ Alumno:  Valentina Sánchez (1°Básico) — al día en pagos");
  console.log("─────────────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
