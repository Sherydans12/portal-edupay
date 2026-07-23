import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { formatGuardianRut } from "@/lib/edupay";
import { sendPasswordResetEmail } from "@/lib/mailer";
import prisma from "@/lib/prisma";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const { identifier } = await request.json();
  const cleanIdentifier =
    typeof identifier === "string" ? identifier.trim() : "";
  const isEmailIdentifier = cleanIdentifier.includes("@");
  const rutIdentifier = isEmailIdentifier
    ? cleanIdentifier
    : formatGuardianRut(cleanIdentifier);

  if (!cleanIdentifier) {
    return NextResponse.json(
      { error: "Ingresa tu RUT o email" },
      { status: 400 },
    );
  }

  const guardian = await prisma.guardianUser.findFirst({
    where: {
      tenant: { isActive: true },
      OR: [
        { rut: rutIdentifier },
        {
          email: {
            equals: cleanIdentifier,
            mode: "insensitive",
          },
        },
      ],
    },
  });

  if (guardian) {
    if (!guardian.email || !EMAIL_PATTERN.test(guardian.email)) {
      return NextResponse.json(
        { error: "El usuario no tiene un correo configurado" },
        { status: 400 },
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await prisma.guardianUser.update({
      where: { id: guardian.id },
      data: {
        resetToken: token,
        resetTokenExpiry,
      },
    });

    await sendPasswordResetEmail(guardian.tenantId, guardian.email, token);
  }

  return NextResponse.json({
    ok: true,
    message:
      "Si encontramos una cuenta asociada, enviaremos instrucciones de recuperación.",
  });
}
