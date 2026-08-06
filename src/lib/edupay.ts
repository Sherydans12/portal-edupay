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

export type EdupayGuardianProfile = {
  exists: boolean;
  id: number | null;
  rut: string | null;
  name: string | null;
  email: string | null;
  updatedAt: string | null;
};

function getDemoGuardianStatement(rut: string): EdupayStatementResponse {
  const guardianRut = formatGuardianRut(rut);
  const isRoberto = guardianRut === "11.111.111-1";

  if (isRoberto) {
    return {
      guardian: {
        id: guardianRut,
        name: "Roberto Sánchez",
        rut: guardianRut,
        email: "roberto.sanchez@example.com",
      },
      students: [
        {
          id: "valentina-sanchez",
          name: "Valentina Sánchez",
          course: "1° Básico",
          accountNumber: "11.111.111-1",
          installments: [
            {
              id: 201,
              month: "Marzo 2026",
              dueDate: "2026-03-10",
              status: "PAGADO",
              amount: 125000,
              paidAt: "2026-03-08",
              purchaseOrder: "OC-26030901",
              authorizationCode: "AUTH-112233",
            },
            {
              id: 202,
              month: "Abril 2026",
              dueDate: "2026-04-10",
              status: "PAGADO",
              amount: 125000,
              paidAt: "2026-04-07",
              purchaseOrder: "OC-26041002",
              authorizationCode: "AUTH-445566",
            },
            {
              id: 203,
              month: "Mayo 2026",
              dueDate: "2026-05-10",
              status: "PAGADO",
              amount: 125000,
              paidAt: "2026-05-08",
              purchaseOrder: "OC-26050903",
              authorizationCode: "AUTH-778899",
            },
          ],
        },
      ],
    };
  }

  return {
    guardian: {
      id: guardianRut,
      name: "Marcela Fuentes",
      rut: guardianRut,
      email: "marcela.fuentes@example.com",
    },
    students: [
      {
        id: "martina-fuentes",
        name: "Martina Fuentes",
        course: "3° Medio",
        accountNumber: "12.345.678-9",
        installments: [
          {
            id: 101,
            month: "Marzo 2026",
            dueDate: "2026-03-10",
            status: "PAGADO",
            amount: 162000,
            paidAt: "2026-03-07",
            purchaseOrder: "OC-26030701",
            authorizationCode: "AUTH-349821",
          },
          {
            id: 102,
            month: "Abril 2026",
            dueDate: "2026-04-10",
            status: "VENCIDO",
            amount: 162000,
          },
          {
            id: 103,
            month: "Mayo 2026",
            dueDate: "2026-05-10",
            status: "POR_VENCER",
            amount: 162000,
          },
        ],
      },
      {
        id: "tomas-fuentes",
        name: "Tomás Fuentes",
        course: "5° Básico",
        accountNumber: "12.345.678-9",
        installments: [
          {
            id: 104,
            month: "Marzo 2026",
            dueDate: "2026-03-10",
            status: "PAGADO",
            amount: 138000,
            paidAt: "2026-03-09",
            purchaseOrder: "OC-26030503",
            authorizationCode: "AUTH-840221",
          },
          {
            id: 105,
            month: "Abril 2026",
            dueDate: "2026-04-10",
            status: "POR_VENCER",
            amount: 138000,
          },
        ],
      },
    ],
  };
}

export interface EdupayPaymentSyncResponse {
  synced: boolean;
}

export type EdupayPaymentSyncInput = {
  buyOrder: string | number;
  amount: string | number;
  authorizationCode?: string | number | null;
  cardNumber?: string | number | null;
  chargeIds: Array<string | number>;
};

type EdupayApiEnvelope<T> = {
  data: T;
};

type EdupayApiErrorPayload = {
  message?: string | string[];
  statusCode?: number;
};

export class EdupayApiError extends Error {
  status: number;
  payload: EdupayApiErrorPayload | null;

  constructor(
    message: string,
    status: number,
    payload: EdupayApiErrorPayload | null = null,
  ) {
    super(message);
    this.name = "EdupayApiError";
    this.status = status;
    this.payload = payload;
  }
}

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
    const payload = (await response.json().catch(() => null)) as
      | EdupayApiErrorPayload
      | null;
    const remoteMessage = Array.isArray(payload?.message)
      ? payload.message.join(". ")
      : payload?.message;

    throw new EdupayApiError(
      remoteMessage ||
        `EduPay respondió ${response.status} al consultar ${path}`,
      response.status,
      payload,
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

/**
 * Confirma que el servidor de EduPay responde usando las mismas credenciales
 * que las integraciones del portal. Una respuesta 4xx confirma conectividad
 * (por ejemplo, algunos gateways no exponen la raíz de la API); los errores
 * 5xx y de red se consideran una dependencia no disponible.
 */
export async function checkEdupayConnection(): Promise<void> {
  const config = getEdupayConfig();
  const response = await fetch(config.apiUrl, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${config.apiToken}`,
      "x-tenant-id": config.tenantId,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(5_000),
  });

  if (response.status >= 500) {
    throw new Error(`EduPay respondió ${response.status} al verificar conectividad`);
  }
}

export async function verifyGuardianExists(rut: string): Promise<boolean> {
  const response = await getGuardianProfile(rut);

  return response.exists;
}

export function getGuardianProfile(
  rut: string,
  tenantId?: string,
): Promise<EdupayGuardianProfile> {
  if (process.env.EDUPAY_USE_DEMO_DATA === "true") {
    const statement = getDemoGuardianStatement(rut);

    return Promise.resolve({
      exists: true,
      id: normalizeRut(rut) === "111111111" ? 2 : 1,
      rut: statement.guardian.rut,
      name: statement.guardian.name,
      email: statement.guardian.email,
      updatedAt: "2026-07-30T16:20:00.000Z",
    });
  }

  return edupayFetch<EdupayGuardianProfile>(
    `/api/v1/portal/guardian/${encodeURIComponent(rut)}`,
    undefined,
    tenantId,
  );
}

export function updateGuardianEmailInEduPay(
  rut: string,
  email: string,
  expectedUpdatedAt: string,
  tenantId?: string,
): Promise<Exclude<EdupayGuardianProfile, { exists: false }>> {
  if (process.env.EDUPAY_USE_DEMO_DATA === "true") {
    const statement = getDemoGuardianStatement(rut);

    return Promise.resolve({
      exists: true,
      id: normalizeRut(rut) === "111111111" ? 2 : 1,
      rut: statement.guardian.rut,
      name: statement.guardian.name,
      email,
      updatedAt: new Date().toISOString(),
    });
  }

  return edupayFetch<Exclude<EdupayGuardianProfile, { exists: false }>>(
    `/api/v1/portal/guardian/${encodeURIComponent(rut)}/email`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, expectedUpdatedAt }),
    },
    tenantId,
  );
}

export function getGuardianStatement(
  rut: string,
): Promise<EdupayStatementResponse> {
  if (process.env.EDUPAY_USE_DEMO_DATA === "true") {
    return Promise.resolve(getDemoGuardianStatement(rut));
  }

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
  input: EdupayPaymentSyncInput,
  tenantId?: string,
): Promise<EdupayPaymentSyncResponse> {
  const payload = createEdupayPaymentSyncPayload(input);

  return edupayFetch<EdupayPaymentSyncResponse>(
    "/api/v1/portal/payments/sync",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    tenantId,
  );
}

export function createEdupayPaymentSyncPayload(
  input: EdupayPaymentSyncInput,
) {
  const amount = Number(input.amount);
  const chargeIds = input.chargeIds.map((id) => Number(id));

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("El monto para sincronizar con EduPay no es válido");
  }

  if (
    chargeIds.length === 0 ||
    !chargeIds.every(
      (id) => typeof id === "number" && Number.isInteger(id),
    )
  ) {
    throw new Error("chargeIds debe contener únicamente números enteros");
  }

  return {
    buyOrder: String(input.buyOrder),
    amount,
    paymentMethod: "WEBPAY" as const,
    authorizationCode: String(input.authorizationCode || "0000"),
    cardNumber: String(input.cardNumber || "0000").slice(-4),
    chargeIds,
  };
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
