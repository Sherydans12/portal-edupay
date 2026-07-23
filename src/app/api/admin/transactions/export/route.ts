import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  createTransactionWhere,
  formatPaymentMethod,
  normalizeReportDate,
  REPORT_TIME_ZONE,
} from "@/lib/transaction-report";

const reportDateFormatter = new Intl.DateTimeFormat("es-CL", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: REPORT_TIME_ZONE,
});

const reportColumns = [
  "Fecha",
  "Orden de Compra",
  "RUT Apoderado",
  "Monto Total",
  "Método",
  "Código Autorización",
  "Estado",
];

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const tenantId = cleanTenantId(request.nextUrl.searchParams.get("tenant"));
  const dateFrom = normalizeReportDate(
    request.nextUrl.searchParams.get("from") ?? undefined,
  );
  const dateTo = normalizeReportDate(
    request.nextUrl.searchParams.get("to") ?? undefined,
  );

  if (dateFrom && dateTo && dateFrom > dateTo) {
    return NextResponse.json(
      { error: "El rango de fechas no es válido" },
      { status: 400 },
    );
  }

  const transactions = await prisma.transaction.findMany({
    where: createTransactionWhere({ tenantId, dateFrom, dateTo }),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      amount: true,
      authorizationCode: true,
      buyOrder: true,
      createdAt: true,
      paymentTypeCode: true,
      status: true,
      transactionDate: true,
      guardian: {
        select: {
          rut: true,
        },
      },
    },
  });

  const rows = transactions.map((transaction) => [
    reportDateFormatter.format(
      transaction.transactionDate ?? transaction.createdAt,
    ),
    transaction.buyOrder,
    transaction.guardian.rut,
    transaction.amount,
    formatPaymentMethod(transaction.paymentTypeCode),
    transaction.authorizationCode ?? "",
    transaction.status,
  ]);
  const csv = `\uFEFF${[reportColumns, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n")}\r\n`;
  const filename = createReportFilename(tenantId, dateFrom, dateTo);

  return new Response(csv, {
    status: 200,
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}

function csvCell(value: string | number) {
  let serialized = String(value);

  if (/^\s*[=+\-@]/.test(serialized)) {
    serialized = `'${serialized}`;
  }

  return `"${serialized.replace(/"/g, '""')}"`;
}

function cleanTenantId(value: string | null) {
  const tenantId = value?.trim();

  return tenantId && tenantId.length <= 100 ? tenantId : undefined;
}

function createReportFilename(
  tenantId?: string,
  dateFrom?: string,
  dateTo?: string,
) {
  const scope = tenantId
    ? tenantId.replace(/[^a-zA-Z0-9_-]/g, "_")
    : "todos";
  const range = `${dateFrom ?? "inicio"}_${dateTo ?? "hoy"}`;

  return `reporte-transacciones_${scope}_${range}.csv`;
}
