export type EdupayInstallmentStatus = "PAGADO" | "VENCIDO" | "POR_VENCER";

export interface EdupayInstallment {
  id: number;
  month: string;
  dueDate: string;
  status: EdupayInstallmentStatus;
  amount: number;
  paidAt?: string;
  purchaseOrder?: string;
  authorizationCode?: string;
}

export interface EdupayStudent {
  id: string;
  name: string;
  course: string;
  accountNumber: string;
  installments: EdupayInstallment[];
}

export interface EdupayStatementResponse {
  guardian: {
    id: string;
    name: string;
    rut: string;
    email: string;
  };
  students: EdupayStudent[];
}

export interface EdupayPaymentSyncResponse {
  synced: boolean;
}

type GuardianExistsResponse = {
  exists: boolean;
};

type EdupayApiEnvelope<T> = {
  data: T;
};

type EdupayRawStatementResponse = {
  guardian: {
    rut: string;
    name: string;
  };
  students: Array<{
    id: number;
    rut: string;
    name: string;
    course: {
      id: number;
      name: string;
    };
    installments: Array<{
      id: number;
      month: string;
      amount: number;
      paidAmount: number;
      outstandingAmount: number;
      status: "PAGADO" | "VENCIDO" | "PENDIENTE";
    }>;
  }>;
};

export function normalizeRut(rut: string) {
  return rut.replace(/[.\s-]/g, "").toUpperCase();
}

export function formatGuardianRut(rut: string) {
  const normalizedRut = normalizeRut(rut);

  if (normalizedRut.length <= 1) {
    return rut.trim();
  }

  const body = normalizedRut.slice(0, -1);
  const verifier = normalizedRut.slice(-1);
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${formattedBody}-${verifier}`;
}

export function getEdupayTenantId(tenantId?: string) {
  const resolvedTenantId = tenantId ?? process.env.NEXT_PUBLIC_TENANT_ID;

  if (!resolvedTenantId) {
    throw new Error("NEXT_PUBLIC_TENANT_ID is not defined");
  }

  return resolvedTenantId;
}

function getEdupayConfig(tenantId?: string) {
  const apiUrl = process.env.EDUPAY_API_URL?.replace(/\/$/, "");
  const apiToken = process.env.EDUPAY_API_TOKEN;
  const resolvedTenantId = getEdupayTenantId(tenantId);

  if (!apiUrl || !apiToken) {
    throw new Error("EDUPAY_API_URL y EDUPAY_API_TOKEN deben estar configuradas");
  }

  return { apiUrl, apiToken, tenantId: resolvedTenantId };
}

async function edupayFetch<T>(
  path: string,
  init?: RequestInit,
  tenantId?: string,
): Promise<T> {
  const config = getEdupayConfig(tenantId);
  const response = await fetch(`${config.apiUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${config.apiToken}`,
      "x-tenant-id": config.tenantId,
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `EduPay respondió ${response.status} al consultar ${path}`,
    );
  }

  const payload = (await response.json()) as T | EdupayApiEnvelope<T>;

  if (
    typeof payload === "object" &&
    payload !== null &&
    "data" in payload
  ) {
    return payload.data;
  }

  return payload;
}

export async function verifyGuardianExists(rut: string): Promise<boolean> {
  const response = await edupayFetch<GuardianExistsResponse>(
    `/api/v1/portal/guardian/${encodeURIComponent(rut)}`,
  );

  return response.exists;
}

export function getGuardianStatement(
  rut: string,
): Promise<EdupayStatementResponse> {
  return edupayFetch<EdupayRawStatementResponse>(
    `/api/v1/portal/guardian/${encodeURIComponent(rut)}/statement`,
  ).then((statement) => ({
    guardian: {
      id: statement.guardian.rut,
      name: statement.guardian.name,
      rut: statement.guardian.rut,
      email: "",
    },
    students: statement.students.map((student) => ({
      id: String(student.id),
      name: student.name,
      course: student.course.name,
      accountNumber: student.rut,
      installments: student.installments.map((installment) => ({
        id: installment.id,
        month: formatInstallmentMonth(installment.month),
        dueDate: `${installment.month}-10`,
        status:
          installment.status === "PENDIENTE"
            ? "POR_VENCER"
            : installment.status,
        amount:
          installment.status === "PAGADO"
            ? installment.amount
            : installment.outstandingAmount,
      })),
    })),
  }));
}

export function syncPaymentWithEduPay(
  buyOrder: string,
  amount: number,
  paymentDate: string,
  installmentsIds: number[],
  tenantId?: string,
): Promise<EdupayPaymentSyncResponse> {
  return edupayFetch<EdupayPaymentSyncResponse>(
    "/api/v1/portal/payments/sync",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        buyOrder,
        amount,
        paymentDate,
        installmentsIds,
      }),
    },
    tenantId,
  );
}

function formatInstallmentMonth(month: string) {
  const date = new Date(`${month}-01T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return month;
  }

  const formatted = new Intl.DateTimeFormat("es-CL", {
    month: "long",
    year: "numeric",
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
