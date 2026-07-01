import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getEdupayTenantId } from "@/lib/edupay";
import prisma from "@/lib/prisma";
import { webpayTransaction } from "@/lib/transbank";

type InitWebpayBody = {
  amount?: unknown;
  sessionId?: unknown;
  edupayPayload?: unknown;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const tenantId = getEdupayTenantId();

  if (
    !session?.user?.id ||
    !session.user.tenantId ||
    session.user.tenantId !== tenantId
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json()) as InitWebpayBody;
  const amount = Number(body.amount);

  if (
    !Number.isInteger(amount) ||
    amount <= 0 ||
    typeof body.sessionId !== "string" ||
    body.sessionId.trim().length === 0 ||
    !Array.isArray(body.edupayPayload) ||
    !body.edupayPayload.every(
      (id) => typeof id === "number" && Number.isInteger(id),
    )
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const returnUrl = `${appUrl.replace(/\/$/, "")}/api/webpay/return`;
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
    },
  });

  return NextResponse.json({
    url: transbankResponse.url,
    token: transbankResponse.token,
  });
}
