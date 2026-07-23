import type { Prisma } from "@prisma/client";

export const REPORT_TIME_ZONE = "America/Santiago";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const paymentTypeLabels: Record<string, string> = {
  NC: "Webpay Plus - Crédito sin interés",
  S2: "Webpay Plus - Crédito, 2 cuotas sin interés",
  SI: "Webpay Plus - Crédito, 3 cuotas sin interés",
  VC: "Webpay Plus - Crédito en cuotas",
  VD: "Webpay Plus - Débito",
  VN: "Webpay Plus - Crédito",
  VP: "Webpay Plus - Prepago",
};

export function normalizeReportDate(value?: string | string[]) {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate || !datePattern.test(candidate)) {
    return undefined;
  }

  const [year, month, day] = candidate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }

  return candidate;
}

export function createTransactionWhere({
  dateFrom,
  dateTo,
  tenantId,
}: {
  dateFrom?: string;
  dateTo?: string;
  tenantId?: string;
}): Prisma.TransactionWhereInput {
  const createdAt: Prisma.DateTimeFilter = {};

  if (dateFrom) {
    createdAt.gte = getStartOfDayInTimeZone(dateFrom);
  }

  if (dateTo) {
    createdAt.lt = getStartOfDayInTimeZone(addCalendarDays(dateTo, 1));
  }

  return {
    ...(tenantId ? { tenantId } : {}),
    ...(dateFrom || dateTo ? { createdAt } : {}),
  };
}

export function formatPaymentMethod(paymentTypeCode: string | null) {
  return paymentTypeCode
    ? paymentTypeLabels[paymentTypeCode] ??
        `Webpay Plus - ${paymentTypeCode}`
    : "Webpay Plus";
}

function addCalendarDays(dateValue: string, days: number) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function getStartOfDayInTimeZone(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const noonUtc = new Date(Date.UTC(year, month - 1, day, 12));
  const offsetFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: REPORT_TIME_ZONE,
    timeZoneName: "longOffset",
  });
  const offsetLabel = offsetFormatter
    .formatToParts(noonUtc)
    .find((part) => part.type === "timeZoneName")?.value;
  const match = offsetLabel?.match(/^GMT([+-])(\d{2}):(\d{2})$/);

  if (!match) {
    return new Date(Date.UTC(year, month - 1, day));
  }

  const direction = match[1] === "+" ? 1 : -1;
  const offsetMinutes = direction * (Number(match[2]) * 60 + Number(match[3]));

  return new Date(Date.UTC(year, month - 1, day) - offsetMinutes * 60_000);
}
