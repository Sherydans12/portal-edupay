import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getGuardianProfile } from "@/lib/edupay";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "GUARDIAN" || !session.user.id) {
    return NextResponse.json({ error: "Sesión no autorizada" }, { status: 401 });
  }

  const guardian = await prisma.guardianUser.findUnique({
    where: { id: session.user.id },
  });

  if (!guardian) {
    return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  }

  const now = new Date();
  let pendingEmail = guardian.pendingEmail;
  let pendingEmailExpiresAt = guardian.emailChangeTokenExpiry;

  if (pendingEmailExpiresAt && pendingEmailExpiresAt <= now) {
    await prisma.guardianUser.update({
      where: { id: guardian.id },
      data: {
        pendingEmail: null,
        emailChangeTokenHash: null,
        emailChangeTokenExpiry: null,
      },
    });
    pendingEmail = null;
    pendingEmailExpiresAt = null;
  }

  try {
    const profile = await getGuardianProfile(guardian.rut, guardian.tenantId);

    if (!profile.exists || !profile.rut || !profile.name) {
      return NextResponse.json(
        { error: "El apoderado ya no está disponible en EduPay" },
        { status: 404 },
      );
    }

    const remoteUpdatedAt = profile.updatedAt
      ? new Date(profile.updatedAt)
      : null;
    const remoteEmail = profile.email?.trim().toLowerCase() || null;
    const useLocalDemoEmail =
      process.env.EDUPAY_USE_DEMO_DATA === "true" && guardian.email;
    const resolvedEmail = useLocalDemoEmail ? guardian.email : remoteEmail;
    const shouldSync =
      process.env.EDUPAY_USE_DEMO_DATA !== "true" &&
      (!guardian.edupayUpdatedAt ||
        !remoteUpdatedAt ||
        remoteUpdatedAt >= guardian.edupayUpdatedAt);

    if (
      shouldSync &&
      (guardian.email !== resolvedEmail ||
        guardian.edupayUpdatedAt?.getTime() !== remoteUpdatedAt?.getTime())
    ) {
      await prisma.guardianUser.update({
        where: { id: guardian.id },
        data: {
          email: resolvedEmail,
          edupayUpdatedAt:
            remoteUpdatedAt && !Number.isNaN(remoteUpdatedAt.getTime())
              ? remoteUpdatedAt
              : undefined,
        },
      });
    }

    return NextResponse.json(
      {
        profile: {
          name: profile.name,
          rut: profile.rut,
          email: resolvedEmail,
          updatedAt: profile.updatedAt,
          sourceStatus: "synced",
          pendingEmail,
          pendingEmailExpiresAt: pendingEmailExpiresAt?.toISOString() ?? null,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "No se pudo actualizar el perfil desde EduPay:",
      error instanceof Error ? error.message : "Error desconocido",
    );

    return NextResponse.json(
      {
        profile: {
          name: null,
          rut: guardian.rut,
          email: guardian.email,
          updatedAt: guardian.edupayUpdatedAt?.toISOString() ?? null,
          sourceStatus: "cached",
          pendingEmail,
          pendingEmailExpiresAt: pendingEmailExpiresAt?.toISOString() ?? null,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
