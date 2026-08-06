import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import {
  checkRateLimit,
  getClientIp,
  getRateLimitHeaders,
  hashRateLimitIdentifier,
} from "@/lib/rate-limit";
import { validatePortalPassword } from "@/lib/password";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "GUARDIAN" || !session.user.id) {
    return NextResponse.json({ error: "Sesión no autorizada" }, { status: 401 });
  }

  const rateLimit = checkRateLimit({
    namespace: "account-password",
    identifier: hashRateLimitIdentifier(
      `${session.user.id}:${getClientIp(request.headers)}`,
    ),
    limit: 8,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera unos minutos." },
      { status: 429, headers: getRateLimitHeaders(rateLimit) },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    currentPassword?: unknown;
    newPassword?: unknown;
  } | null;
  const currentPassword =
    typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword =
    typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Completa la contraseña actual y la nueva" },
      { status: 400 },
    );
  }

  const passwordError = validatePortalPassword(newPassword);

  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
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

  if (await bcrypt.compare(newPassword, guardian.passwordHash)) {
    return NextResponse.json(
      { error: "La nueva contraseña debe ser diferente de la actual" },
      { status: 400 },
    );
  }

  await prisma.guardianUser.update({
    where: { id: guardian.id },
    data: {
      passwordHash: await bcrypt.hash(newPassword, 10),
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return NextResponse.json(
    { ok: true, message: "Contraseña actualizada correctamente" },
    { headers: getRateLimitHeaders(rateLimit) },
  );
}
