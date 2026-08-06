import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getGuardianProfile } from "@/lib/edupay";
import { sendEmailChangeVerification } from "@/lib/mailer";
import {
  checkRateLimit,
  getClientIp,
  getRateLimitHeaders,
  hashRateLimitIdentifier,
} from "@/lib/rate-limit";
import prisma from "@/lib/prisma";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_CHANGE_TTL_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "GUARDIAN" || !session.user.id) {
    return NextResponse.json({ error: "Sesión no autorizada" }, { status: 401 });
  }

  const rateLimit = checkRateLimit({
    namespace: "account-email-change",
    identifier: hashRateLimitIdentifier(
      `${session.user.id}:${getClientIp(request.headers)}`,
    ),
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Superaste el límite de solicitudes. Intenta más tarde." },
      { status: 429, headers: getRateLimitHeaders(rateLimit) },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    email?: unknown;
    currentPassword?: unknown;
  } | null;
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const currentPassword =
    typeof body?.currentPassword === "string" ? body.currentPassword : "";

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { error: "Ingresa un correo electrónico válido" },
      { status: 400 },
    );
  }

  if (!currentPassword) {
    return NextResponse.json(
      { error: "Ingresa tu contraseña actual para continuar" },
      { status: 400 },
    );
  }

  const guardian = await prisma.guardianUser.findUnique({
    where: { id: session.user.id },
  });

  if (!guardian) {
    return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  }

  if (!(await bcrypt.compare(currentPassword, guardian.passwordHash))) {
    return NextResponse.json(
      { error: "La contraseña actual no es correcta" },
      { status: 400, headers: getRateLimitHeaders(rateLimit) },
    );
  }

  let currentEmail = guardian.email?.trim().toLowerCase() ?? null;

  try {
    const profile = await getGuardianProfile(guardian.rut, guardian.tenantId);

    if (!profile.exists) {
      return NextResponse.json(
        { error: "No encontramos el apoderado en EduPay" },
        { status: 404 },
      );
    }

    if (process.env.EDUPAY_USE_DEMO_DATA !== "true") {
      currentEmail = profile.email?.trim().toLowerCase() ?? null;
    }
  } catch (error) {
    console.error(
      "No se pudo comprobar el correo actual en EduPay:",
      error instanceof Error ? error.message : "Error desconocido",
    );
    return NextResponse.json(
      {
        error:
          "No pudimos conectarnos con EduPay. Tu correo no fue modificado.",
      },
      { status: 503 },
    );
  }

  if (currentEmail === email) {
    return NextResponse.json(
      { error: "Ese correo ya está asociado a tu cuenta" },
      { status: 400 },
    );
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + EMAIL_CHANGE_TTL_MS);

  await prisma.guardianUser.update({
    where: { id: guardian.id },
    data: {
      pendingEmail: email,
      emailChangeTokenHash: tokenHash,
      emailChangeTokenExpiry: expiresAt,
    },
  });

  try {
    const verificationUrl = await sendEmailChangeVerification(
      guardian.tenantId,
      email,
      token,
    );
    const exposeDevelopmentLink =
      process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY;

    return NextResponse.json(
      {
        ok: true,
        pendingEmail: email,
        expiresAt: expiresAt.toISOString(),
        verificationUrl: exposeDevelopmentLink ? verificationUrl : undefined,
      },
      { headers: getRateLimitHeaders(rateLimit) },
    );
  } catch (error) {
    await prisma.guardianUser.update({
      where: { id: guardian.id },
      data: {
        pendingEmail: null,
        emailChangeTokenHash: null,
        emailChangeTokenExpiry: null,
      },
    });

    console.error(
      "No se pudo enviar la verificación del correo:",
      error instanceof Error ? error.message : "Error desconocido",
    );
    return NextResponse.json(
      { error: "No pudimos enviar la confirmación. Intenta nuevamente." },
      { status: 502 },
    );
  }
}
