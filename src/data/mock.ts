import type { Guardian } from "@/types/payments";

// ──────────────────────────────────────────────
// Credenciales de prueba
// ──────────────────────────────────────────────
export const DEMO_CREDENTIALS = {
  rut: "12.345.678-9",
  password: "demo123",
};

export const DEMO_CREDENTIALS_2 = {
  rut: "11.111.111-1",
  password: "test456",
};

// ──────────────────────────────────────────────
// Apoderado 1 — Marcela Fuentes (2 alumnos)
// ──────────────────────────────────────────────
export const mockGuardian: Guardian = {
  id: "apo-001",
  name: "Marcela Fuentes Rojas",
  rut: DEMO_CREDENTIALS.rut,
  email: "marcela.fuentes@example.com",
  students: [
    {
      id: "alu-001",
      name: "Martina Fuentes",
      course: "3° Medio A",
      accountNumber: "CC-2026-001",
      installments: [
        {
          id: "mar-mar",
          month: "Marzo",
          dueDate: "2026-03-10",
          status: "PAGADO",
          amount: 162000,
          paidAt: "2026-03-07T14:24:00.000Z",
          purchaseOrder: "OC-26030701",
          authorizationCode: "AUTH-349821",
        },
        {
          id: "mar-abr",
          month: "Abril",
          dueDate: "2026-04-10",
          status: "VENCIDO",
          amount: 162000,
        },
        {
          id: "mar-may",
          month: "Mayo",
          dueDate: "2026-05-10",
          status: "PAGADO",
          amount: 162000,
          paidAt: "2026-05-08T16:10:00.000Z",
          purchaseOrder: "OC-26050802",
          authorizationCode: "AUTH-572410",
        },
        {
          id: "mar-jun",
          month: "Junio",
          dueDate: "2026-06-10",
          status: "VENCIDO",
          amount: 162000,
        },
        {
          id: "mar-jul",
          month: "Julio",
          dueDate: "2026-07-10",
          status: "POR_VENCER",
          amount: 162000,
        },
        {
          id: "mar-ago",
          month: "Agosto",
          dueDate: "2026-08-10",
          status: "POR_VENCER",
          amount: 162000,
        },
      ],
    },
    {
      id: "alu-002",
      name: "Tomás Fuentes",
      course: "5° Básico B",
      accountNumber: "CC-2026-002",
      installments: [
        {
          id: "tom-mar",
          month: "Marzo",
          dueDate: "2026-03-10",
          status: "PAGADO",
          amount: 138000,
          paidAt: "2026-03-05T13:40:00.000Z",
          purchaseOrder: "OC-26030503",
          authorizationCode: "AUTH-840221",
        },
        {
          id: "tom-abr",
          month: "Abril",
          dueDate: "2026-04-10",
          status: "PAGADO",
          amount: 138000,
          paidAt: "2026-04-06T15:18:00.000Z",
          purchaseOrder: "OC-26040604",
          authorizationCode: "AUTH-748133",
        },
        {
          id: "tom-may",
          month: "Mayo",
          dueDate: "2026-05-10",
          status: "PAGADO",
          amount: 138000,
          paidAt: "2026-05-06T12:09:00.000Z",
          purchaseOrder: "OC-26050605",
          authorizationCode: "AUTH-984325",
        },
        {
          id: "tom-jun",
          month: "Junio",
          dueDate: "2026-06-10",
          status: "VENCIDO",
          amount: 138000,
        },
        {
          id: "tom-jul",
          month: "Julio",
          dueDate: "2026-07-10",
          status: "POR_VENCER",
          amount: 138000,
        },
      ],
    },
  ],
};

// ──────────────────────────────────────────────
// Apoderado 2 — Roberto Sánchez (1 alumno)
// ──────────────────────────────────────────────
export const mockGuardian2: Guardian = {
  id: "apo-002",
  name: "Roberto Sánchez Mora",
  rut: DEMO_CREDENTIALS_2.rut,
  email: "roberto.sanchez@example.com",
  students: [
    {
      id: "alu-003",
      name: "Valentina Sánchez",
      course: "1° Básico C",
      accountNumber: "CC-2026-003",
      installments: [
        {
          id: "val-mar",
          month: "Marzo",
          dueDate: "2026-03-10",
          status: "PAGADO",
          amount: 125000,
          paidAt: "2026-03-09T10:05:00.000Z",
          purchaseOrder: "OC-26030901",
          authorizationCode: "AUTH-112233",
        },
        {
          id: "val-abr",
          month: "Abril",
          dueDate: "2026-04-10",
          status: "PAGADO",
          amount: 125000,
          paidAt: "2026-04-10T09:30:00.000Z",
          purchaseOrder: "OC-26041002",
          authorizationCode: "AUTH-445566",
        },
        {
          id: "val-may",
          month: "Mayo",
          dueDate: "2026-05-10",
          status: "PAGADO",
          amount: 125000,
          paidAt: "2026-05-09T11:20:00.000Z",
          purchaseOrder: "OC-26050903",
          authorizationCode: "AUTH-778899",
        },
        {
          id: "val-jun",
          month: "Junio",
          dueDate: "2026-06-10",
          status: "PAGADO",
          amount: 125000,
          paidAt: "2026-06-08T14:45:00.000Z",
          purchaseOrder: "OC-26060804",
          authorizationCode: "AUTH-332211",
        },
        {
          id: "val-jul",
          month: "Julio",
          dueDate: "2026-07-10",
          status: "POR_VENCER",
          amount: 125000,
        },
        {
          id: "val-ago",
          month: "Agosto",
          dueDate: "2026-08-10",
          status: "POR_VENCER",
          amount: 125000,
        },
      ],
    },
  ],
};

// ──────────────────────────────────────────────
// Mapa RUT → datos de apoderado (para auth mock)
// ──────────────────────────────────────────────
export const MOCK_GUARDIAN_MAP: Record<string, Guardian> = {
  [DEMO_CREDENTIALS.rut]: mockGuardian,
  [DEMO_CREDENTIALS_2.rut]: mockGuardian2,
};
