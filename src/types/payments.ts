export type InstallmentStatus = "PAGADO" | "VENCIDO" | "POR_VENCER";

export type Installment = {
  id: string;
  month: string;
  dueDate: string;
  status: InstallmentStatus;
  amount: number;
  paidAt?: string;
  purchaseOrder?: string;
  authorizationCode?: string;
};

export type Student = {
  id: string;
  name: string;
  course: string;
  accountNumber: string;
  installments: Installment[];
};

export type Guardian = {
  id: string;
  name: string;
  rut: string;
  email: string;
  students: Student[];
};
