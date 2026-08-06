import { createHmac, timingSafeEqual } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { formatGuardianRut } from "@/lib/edupay";
import prisma from "@/lib/prisma";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EVENT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SIGNATURE_TOLERANCE_MS = 5 * 60 * 1000;

type GuardianEmailEvent = {
  eventId: string;
  type: "guardian.email.updated";
  occurredAt: string;
  tenantId: string;
  guardian: {
    id: number;
    rut: string;
    email: string;
    previousEmail: string | null;
    updatedAt: string;
  };
  source: "PORTAL" | "EDUPAY_ADMIN";
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const eventIdHeader = request.headers.get("x-edupay-event-id")?.trim() ?? "";
  const timestamp = request.headers.get("x-edupay-timestamp")?.trim() ?? "";
  const signature = request.headers.get("x-edupay-signature")?.trim() ?? "";
  const timestampDate = new Date(timestamp);

  if (
    !timestamp ||
    Number.isNaN(timestampDate.getTime()) ||
    Math.abs(Date.now() - timestampDate.getTime()) > SIGNATURE_TOLERANCE_MS
  ) {
    return NextResponse.json(
      { error: "Timestamp ausente o fuera de tolerancia" },
      { status: 401 },
    );
  }

  const payload = parseEvent(rawBody);

  if (!payload || payload.eventId !== eventIdHeader) {
    return NextResponse.json(
      { error: "Evento de EduPay inválido" },
      { status: 400 },
    );
  }

  const secret = getWebhookSecret(payload.tenantId);

  if (!secret || secret.length < 32) {
    console.error(
      `Webhook de correo no configurado para el tenant ${payload.tenantId}`,
    );
    return NextResponse.json(
      { error: "Integración no configurada" },
      { status: 503 },
    );
  }

  const expectedSignature = `sha256=${createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex")}`;

  if (!safeEqual(signature, expectedSignature)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const configuredTenantId = process.env.NEXT_PUBLIC_TENANT_ID;

  if (configuredTenantId && payload.tenantId !== configuredTenantId) {
    return NextResponse.json({ error: "Tenant desconocido" }, { status: 404 });
  }

  const occurredAt = new Date(payload.occurredAt);
  const edupayUpdatedAt = new Date(payload.guardian.updatedAt);

  if (
    Number.isNaN(occurredAt.getTime()) ||
    Number.isNaN(edupayUpdatedAt.getTime())
  ) {
    return NextResponse.json(
      { error: "Fechas del evento inválidas" },
      { status: 400 },
    );
  }

  try {
    const existing = await prisma.edupayWebhookEvent.findUnique({
      where: { eventId: payload.eventId },
    });

    if (existing) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    await prisma.$transaction(async (transaction) => {
      const guardian = await transaction.guardianUser.findUnique({
        where: {
          tenantId_rut: {
            tenantId: payload.tenantId,
            rut: formatGuardianRut(payload.guardian.rut),
          },
        },
      });

      if (
        guardian &&
        (!guardian.edupayUpdatedAt ||
          edupayUpdatedAt >= guardian.edupayUpdatedAt)
      ) {
        await transaction.guardianUser.update({
          where: { id: guardian.id },
          data: {
            email: payload.guardian.email.trim().toLowerCase(),
            edupayUpdatedAt,
            pendingEmail: null,
            emailChangeTokenHash: null,
            emailChangeTokenExpiry: null,
          },
        });
      }

      await transaction.edupayWebhookEvent.create({
        data: {
          eventId: payload.eventId,
          tenantId: payload.tenantId,
          type: payload.type,
          guardianRut: formatGuardianRut(payload.guardian.rut),
          guardianEmail: payload.guardian.email.trim().toLowerCase(),
          source: payload.source,
          occurredAt,
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    console.error(
      "No se pudo procesar el webhook de EduPay:",
      error instanceof Error ? error.message : "Error desconocido",
    );
    return NextResponse.json(
      { error: "No se pudo procesar el evento" },
      { status: 500 },
    );
  }
}

function parseEvent(rawBody: string): GuardianEmailEvent | null {
  try {
    const value = JSON.parse(rawBody) as Partial<GuardianEmailEvent>;
    const email = value.guardian?.email;

    if (
      value.type !== "guardian.email.updated" ||
      !value.eventId ||
      !EVENT_ID_PATTERN.test(value.eventId) ||
      !value.tenantId ||
      !value.occurredAt ||
      !value.guardian ||
      typeof value.guardian.rut !== "string" ||
      typeof email !== "string" ||
      !EMAIL_PATTERN.test(email.trim()) ||
      typeof value.guardian.updatedAt !== "string" ||
      (value.source !== "PORTAL" && value.source !== "EDUPAY_ADMIN")
    ) {
      return null;
    }

    return value as GuardianEmailEvent;
  } catch {
    return null;
  }
}

function getWebhookSecret(tenantId: string) {
  const secretsMap = process.env.EDUPAY_GUARDIAN_EMAIL_WEBHOOK_SECRETS;

  if (secretsMap) {
    try {
      const parsed = JSON.parse(secretsMap) as Record<string, string>;
      return parsed[tenantId]?.trim() || null;
    } catch {
      return null;
    }
  }

  if (
    !process.env.NEXT_PUBLIC_TENANT_ID ||
    tenantId === process.env.NEXT_PUBLIC_TENANT_ID
  ) {
    return process.env.EDUPAY_GUARDIAN_EMAIL_WEBHOOK_SECRET?.trim() || null;
  }

  return null;
}

function safeEqual(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}
