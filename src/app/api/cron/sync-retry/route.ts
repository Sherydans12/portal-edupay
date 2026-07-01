import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { syncPaymentWithEduPay } from "@/lib/edupay";
import prisma from "@/lib/prisma";

type RetryDetail = {
  buyOrder: string;
  success: boolean;
  error?: string;
};

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transactions = await findPendingTransactions();
  const result = await retryTransactions(transactions);

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    buyOrder?: unknown;
  } | null;

  if (!body || typeof body.buyOrder !== "string" || !body.buyOrder.trim()) {
    return NextResponse.json(
      { error: "La orden de compra es obligatoria" },
      { status: 400 },
    );
  }

  const transactions = await findPendingTransactions(body.buyOrder.trim());

  if (transactions.length === 0) {
    return NextResponse.json(
      { error: "No hay una transacción pendiente de sincronización" },
      { status: 404 },
    );
  }

  const result = await retryTransactions(transactions);
  return NextResponse.json(result, {
    status: result.failed > 0 ? 502 : 200,
  });
}

function findPendingTransactions(buyOrder?: string) {
  return prisma.transaction.findMany({
    where: {
      status: "AUTHORIZED",
      edupaySynced: false,
      ...(buyOrder ? { buyOrder } : {}),
    },
    select: {
      buyOrder: true,
      amount: true,
      updatedAt: true,
      edupayPayload: true,
      tenantId: true,
    },
  });
}

async function retryTransactions(
  transactions: Awaited<ReturnType<typeof findPendingTransactions>>,
) {
  const details: RetryDetail[] = [];
  let success = 0;
  let failed = 0;

  for (const transaction of transactions) {
    try {
      const installmentsIds = parseInstallmentIds(transaction.edupayPayload);
      const syncResponse = await syncPaymentWithEduPay(
        transaction.buyOrder,
        transaction.amount,
        transaction.updatedAt.toISOString(),
        installmentsIds,
        transaction.tenantId,
      );

      if (!syncResponse.synced) {
        throw new Error("EduPay no confirmó la sincronización");
      }

      await prisma.transaction.update({
        where: { buyOrder: transaction.buyOrder },
        data: { edupaySynced: true },
      });

      success += 1;
      details.push({
        buyOrder: transaction.buyOrder,
        success: true,
      });
    } catch (error) {
      failed += 1;
      const message =
        error instanceof Error ? error.message : "Error desconocido";

      console.error(
        `No se pudo reintentar la sincronización de ${transaction.buyOrder}`,
        error,
      );
      details.push({
        buyOrder: transaction.buyOrder,
        success: false,
        error: message,
      });
    }
  }

  return {
    processed: transactions.length,
    success,
    failed,
    details,
  };
}

function parseInstallmentIds(payload: unknown): number[] {
  if (!Array.isArray(payload)) {
    throw new Error("El payload de EduPay no es un array");
  }

  const installmentsIds = payload.map(Number);

  if (
    installmentsIds.length === 0 ||
    !installmentsIds.every((id) => Number.isInteger(id))
  ) {
    throw new Error("El payload de EduPay contiene IDs de cuotas inválidos");
  }

  return installmentsIds;
}
