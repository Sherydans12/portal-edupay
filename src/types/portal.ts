import type { Installment } from "@/types/payments";

export type ActiveSection = "account" | "history" | "certificates";
export type PaymentState = "IDLE" | "TRANSACTION" | "RECEIPT";

export type PaymentSnapshot = {
  studentId: string;
  installments: Installment[];
  total: number;
};

export type PaymentConfirmation = {
  purchaseOrder: string;
  authorizationCode: string;
  paidAt: string;
};

export type WebpayReceipt = PaymentSnapshot & PaymentConfirmation;
