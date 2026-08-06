import crypto from "node:crypto";
import type { GuardianUser } from "@prisma/client";
import { NextResponse } from "next/server";
import { formatGuardianRut, getGuardianProfile } from "@/lib/edupay";
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

  const configuredTenantId = process.env.NEXT_PUBLIC_TENANT_ID;
  let guardian: GuardianUser | null = null;

  if (isEmailIdentifier) {
    const matches = await prisma.guardianUser.findMany({
      where: {
        ...(configuredTenantId ? { tenantId: configuredTenantId } : {}),
        tenant: { isActive: true },
        email: {
          equals: cleanIdentifier,
          mode: "insensitive",
        },
      },
      take: 2,
    });

    guardian = matches.length === 1 ? matches[0] : null;
  } else {
    guardian = await prisma.guardianUser.findFirst({
      where: {
        ...(configuredTenantId ? { tenantId: configuredTenantId } : {}),
        tenant: { isActive: true },
        rut: rutIdentifier,
      },
    });
  }

  if (guardian) {
    let deliveryEmail = guardian.email;

    if (!isEmailIdentifier) {
      try {
        const profile = await getGuardianProfile(
          guardian.rut,
          guardian.tenantId,
        );

        if (
          profile.exists &&
          profile.email &&
          EMAIL_PATTERN.test(profile.email)
        ) {
          deliveryEmail = profile.email.trim().toLowerCase();

          if (deliveryEmail !== guardian.email) {
            await prisma.guardianUser.update({
              where: { id: guardian.id },
              data: {
                email: deliveryEmail,
                edupayUpdatedAt: profile.updatedAt
                  ? new Date(profile.updatedAt)
                  : undefined,
              },
            });
          }
        }
      } catch (error) {
        console.error(
          "No se pudo reconciliar el correo de recuperación con EduPay:",
          error instanceof Error ? error.message : "Error desconocido",
        );
      }
    }

    if (!deliveryEmail || !EMAIL_PATTERN.test(deliveryEmail)) {
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

    await sendPasswordResetEmail(guardian.tenantId, deliveryEmail, token);
  }

  return NextResponse.json({
    ok: true,
    message:
      "Si encontramos una cuenta asociada, enviaremos instrucciones de recuperación.",
  });
}
