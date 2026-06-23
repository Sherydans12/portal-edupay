import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const { token, newPassword } = await request.json();
  const cleanToken = typeof token === "string" ? token.trim() : "";

  if (!cleanToken || typeof newPassword !== "string" || !newPassword) {
    return NextResponse.json(
      { error: "Token y nueva contraseña son obligatorios" },
      { status: 400 },
    );
  }

  const guardian = await prisma.guardianUser.findFirst({
    where: {
      resetToken: cleanToken,
      resetTokenExpiry: {
        gt: new Date(),
      },
    },
  });

  if (!guardian) {
    return NextResponse.json(
      { error: "El enlace de recuperación no es válido o expiró" },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.guardianUser.update({
    where: { id: guardian.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return NextResponse.json({ ok: true });
}
