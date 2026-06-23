import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { formatGuardianRut, verifyGuardianExists } from "@/lib/edupay";
import prisma from "@/lib/prisma";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const { rut, email, password } = await request.json();
  const rawRut = typeof rut === "string" ? rut.trim() : "";
  const cleanRut = rawRut ? formatGuardianRut(rawRut) : "";
  const cleanEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!cleanRut || !cleanEmail || typeof password !== "string" || !password) {
    return NextResponse.json(
      { error: "RUT, email y contraseña son obligatorios" },
      { status: 400 },
    );
  }

  if (!EMAIL_PATTERN.test(cleanEmail)) {
    return NextResponse.json(
      { error: "Ingresa un email válido" },
      { status: 400 },
    );
  }

  const guardianExistsInEduPay = await verifyGuardianExists(cleanRut);

  if (!guardianExistsInEduPay) {
    return NextResponse.json(
      { error: "RUT no registrado en la institución" },
      { status: 400 },
    );
  }

  const tenant = await prisma.tenant.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (!tenant) {
    return NextResponse.json(
      { error: "No hay institución activa configurada" },
      { status: 500 },
    );
  }

  const existingGuardian = await prisma.guardianUser.findUnique({
    where: {
      tenantId_rut: {
        tenantId: tenant.id,
        rut: cleanRut,
      },
    },
  });

  if (existingGuardian) {
    return NextResponse.json(
      { error: "El usuario ya tiene una cuenta" },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.guardianUser.create({
    data: {
      tenantId: tenant.id,
      rut: cleanRut,
      email: cleanEmail,
      passwordHash,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
