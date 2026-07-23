ALTER TABLE "Transaction"
ADD COLUMN "cardLastFour" TEXT,
ADD COLUMN "paymentTypeCode" TEXT,
ADD COLUMN "installmentsNumber" INTEGER,
ADD COLUMN "transactionDate" TIMESTAMP(3),
ADD COLUMN "receiptItems" JSONB;
