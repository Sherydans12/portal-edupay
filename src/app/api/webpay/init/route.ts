import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getPublicAppUrl } from "@/lib/app-url";
import { getEdupayTenantId } from "@/lib/edupay";
import prisma from "@/lib/prisma";
import {
  checkRateLimit,
  getClientIp,
  getRateLimitHeaders,
  hashRateLimitIdentifier,
  type RateLimitResult,
} from "@/lib/rate-limit";
import { webpayTransaction } from "@/lib/transbank";
import type { PaymentReceiptItem } from "@/types/payments";

type InitWebpayBody = {
  amount?: unknown;
  sessionId?: unknown;
  edupayPayload?: unknown;
  receiptItems?: unknown;
};

export async function POST(request: Request) {
  const ipLimit = checkRateLimit({
    namespace: "webpay-init-ip",
    identifier: hashRateLimitIdentifier(getClientIp(request.headers)),
    limit: 20,
    windowMs: 5 * 60 * 1000,
  });

  if (!ipLimit.allowed) {
    return createRateLimitResponse(ipLimit);
  }

  const session = await getServerSession(authOptions);
  const tenantId = getEdupayTenantId();

  if (
    !session?.user?.id ||
    !session.user.tenantId ||
    session.user.tenantId !== tenantId
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const guardianLimit = checkRateLimit({
    namespace: "webpay-init-guardian",
    identifier: hashRateLimitIdentifier(
      `${session.user.tenantId}:${session.user.id}`,
    ),
    limit: 5,
    windowMs: 5 * 60 * 1000,
  });

  if (!guardianLimit.allowed) {
    return createRateLimitResponse(guardianLimit);
  }

  const body = (await request.json()) as InitWebpayBody;
  const amount = Number(body.amount);
  const receiptItems = parseReceiptItems(body.receiptItems);

  if (
    !Number.isInteger(amount) ||
    amount <= 0 ||
    typeof body.sessionId !== "string" ||
    body.sessionId.trim().length === 0 ||
    !Array.isArray(body.edupayPayload) ||
    !body.edupayPayload.every(
      (id) => typeof id === "number" && Number.isInteger(id),
    ) ||
    (body.receiptItems !== undefined && receiptItems === null) ||
    (receiptItems !== null &&
      !receiptItemsMatchPayment(receiptItems, body.edupayPayload, amount))
  ) {
    return NextResponse.json(
      { error: "Datos de pago inválidos" },
      { status: 400 },
    );
  }

  const guardian = await prisma.guardianUser.findFirst({
    where: {
      id: session.user.id,
      tenantId,
    },
    select: {
      id: true,
      tenantId: true,
    },
  });

  if (!guardian) {
    return NextResponse.json({ error: "Apoderado no encontrado" }, { status: 404 });
  }

  const returnUrl = new URL(
    "/api/webpay/return",
    getPublicAppUrl(request),
  ).toString();
  const buyOrder = `OC-${Date.now()}`;
  const transbankResponse = await webpayTransaction.create(
    buyOrder,
    body.sessionId,
    amount,
    returnUrl,
  );

  await prisma.transaction.create({
    data: {
      tenantId,
      guardianId: guardian.id,
      buyOrder,
      sessionId: body.sessionId,
      tokenWs: transbankResponse.token,
      amount,
      status: "PENDING",
      edupayPayload: body.edupayPayload,
      receiptItems: receiptItems ?? undefined,
    },
  });

  return NextResponse.json(
    {
      url: transbankResponse.url,
      token_ws: transbankResponse.token,
      // Alias temporal para clientes desplegados antes del cambio de contrato.
      token: transbankResponse.token,
    },
    {
      headers: getRateLimitHeaders(guardianLimit),
    },
  );
}

function createRateLimitResponse(result: RateLimitResult) {
  return NextResponse.json(
    {
      error: "Demasiadas solicitudes de pago. Intenta nuevamente más tarde.",
      retryAfterSeconds: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        ...getRateLimitHeaders(result),
        "Cache-Control": "no-store",
      },
    },
  );
}

function parseReceiptItems(value: unknown): PaymentReceiptItem[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 100) {
    return null;
  }

  const items: PaymentReceiptItem[] = [];

  for (const item of value) {
    if (
      typeof item !== "object" ||
      item === null ||
      !("installmentId" in item) ||
      !("studentName" in item) ||
      !("concept" in item) ||
      !("month" in item) ||
      !("amount" in item)
    ) {
      return null;
    }

    const installmentId = Number(item.installmentId);
    const amount = Number(item.amount);
    const studentName = cleanReceiptText(item.studentName);
    const concept = cleanReceiptText(item.concept);
    const month = cleanReceiptText(item.month);

    if (
      !Number.isInteger(installmentId) ||
      installmentId <= 0 ||
      !Number.isInteger(amount) ||
      amount <= 0 ||
      !studentName ||
      !concept ||
      !month
    ) {
      return null;
    }

    items.push({ installmentId, studentName, concept, month, amount });
  }

  return items;
}

function cleanReceiptText(value: unknown) {
  return typeof value === "string" && value.trim().length <= 120
    ? value.trim()
    : "";
}

function receiptItemsMatchPayment(
  receiptItems: PaymentReceiptItem[],
  installmentIds: unknown[],
  amount: number,
) {
  const expectedIds = [...installmentIds].map(Number).sort((a, b) => a - b);
  const receivedIds = receiptItems
    .map((item) => item.installmentId)
    .sort((a, b) => a - b);
  const receiptTotal = receiptItems.reduce(
    (total, item) => total + item.amount,
    0,
  );

  return (
    new Set(receivedIds).size === receivedIds.length &&
    expectedIds.length === receivedIds.length &&
    expectedIds.every((id, index) => id === receivedIds[index]) &&
    receiptTotal === amount
  );
}
