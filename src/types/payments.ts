import type {
  EdupayInstallment,
  EdupayInstallmentStatus,
  EdupayStudent,
} from "@/lib/edupay";

export type InstallmentStatus = EdupayInstallmentStatus;
export type Installment = EdupayInstallment;
export type Student = EdupayStudent;

export type PaymentReceiptItem = {
  installmentId: number;
  studentName: string;
  concept: string;
  month: string;
  amount: number;
};

export type Guardian = {
  id: string;
  name: string;
  rut: string;
  email: string;
  students: Student[];
};
