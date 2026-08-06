import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import {
  EdupayApiError,
  getGuardianProfile,
  updateGuardianEmailInEduPay,
} from "@/lib/edupay";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    token?: unknown;
  } | null;
  const token = typeof body?.token === "string" ? body.token.trim() : "";

  if (!token) {
    return NextResponse.json(
      { error: "El enlace de confirmación no es válido" },
      { status: 400 },
    );
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const guardian = await prisma.guardianUser.findUnique({
    where: { emailChangeTokenHash: tokenHash },
  });

  if (
    !guardian ||
    !guardian.pendingEmail ||
    !guardian.emailChangeTokenExpiry ||
    guardian.emailChangeTokenExpiry <= new Date()
  ) {
    if (guardian) {
      await clearPendingEmailChange(guardian.id);
    }

    return NextResponse.json(
      { error: "Este enlace ya fue utilizado o expiró" },
      { status: 400 },
    );
  }

  const pendingEmail = guardian.pendingEmail.trim().toLowerCase();

  try {
    const profile = await getGuardianProfile(guardian.rut, guardian.tenantId);

    if (!profile.exists || !profile.updatedAt) {
      return NextResponse.json(
        { error: "No pudimos validar el apoderado en EduPay" },
        { status: 404 },
      );
    }

    const updatedProfile = await updateGuardianEmailInEduPay(
      guardian.rut,
      pendingEmail,
      profile.updatedAt,
      guardian.tenantId,
    );
    const edupayUpdatedAt = updatedProfile.updatedAt
      ? new Date(updatedProfile.updatedAt)
      : new Date();

    await prisma.guardianUser.update({
      where: { id: guardian.id },
      data: {
        email: pendingEmail,
        edupayUpdatedAt,
        pendingEmail: null,
        emailChangeTokenHash: null,
        emailChangeTokenExpiry: null,
      },
    });

    return NextResponse.json({
      ok: true,
      email: pendingEmail,
      message: "Tu correo fue actualizado correctamente",
    });
  } catch (error) {
    if (error instanceof EdupayApiError && error.status === 409) {
      const currentProfile = await getGuardianProfile(
        guardian.rut,
        guardian.tenantId,
      ).catch(() => null);

      if (
        currentProfile?.exists &&
        currentProfile.email?.trim().toLowerCase() === pendingEmail
      ) {
        await prisma.guardianUser.update({
          where: { id: guardian.id },
          data: {
            email: pendingEmail,
            edupayUpdatedAt: currentProfile.updatedAt
              ? new Date(currentProfile.updatedAt)
              : undefined,
            pendingEmail: null,
            emailChangeTokenHash: null,
            emailChangeTokenExpiry: null,
          },
        });

        return NextResponse.json({
          ok: true,
          email: pendingEmail,
          message: "Tu correo ya estaba actualizado",
        });
      }

      await clearPendingEmailChange(guardian.id);

      return NextResponse.json(
        {
          error:
            "Los datos cambiaron mientras confirmabas. Vuelve a iniciar la solicitud desde Mi cuenta.",
        },
        { status: 409 },
      );
    }

    console.error(
      "No se pudo confirmar el cambio de correo:",
      error instanceof Error ? error.message : "Error desconocido",
    );
    return NextResponse.json(
      {
        error:
          "No pudimos completar el cambio. Tu correo anterior sigue vigente.",
      },
      { status: 503 },
    );
  }
}

function clearPendingEmailChange(guardianId: string) {
  return prisma.guardianUser.update({
    where: { id: guardianId },
    data: {
      pendingEmail: null,
      emailChangeTokenHash: null,
      emailChangeTokenExpiry: null,
    },
  });
}
