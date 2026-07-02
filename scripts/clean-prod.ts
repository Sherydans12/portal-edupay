import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const testGuardianFilters = [
  { rut: "12.345.678-9" },
  { rut: "11.111.111-1" },
  { email: "marcela.fuentes@example.com" },
  { email: "roberto.sanchez@example.com" },
];

async function main() {
  if (process.env.NODE_ENV !== "production") {
    throw new Error("Este script solo debe ejecutarse con NODE_ENV=production.");
  }

  console.log("Iniciando limpieza de datos de prueba en produccion...");

  const deletedTransactions = await prisma.transaction.deleteMany();
  const deletedGuardians = await prisma.guardianUser.deleteMany({
    where: {
      OR: testGuardianFilters,
    },
  });

  console.log(`Transacciones eliminadas: ${deletedTransactions.count}`);
  console.log(`Apoderados de prueba eliminados: ${deletedGuardians.count}`);
  console.log("Super Admin y Tenant no fueron modificados.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
