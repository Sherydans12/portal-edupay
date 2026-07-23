-- CreateEnum
CREATE TYPE "EmailType" AS ENUM (
    'PAYMENT_RECEIPT',
    'FORGOT_PASSWORD',
    'WELCOME',
    'SYSTEM'
);

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM (
    'SENT',
    'FAILED',
    'SIMULATED'
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "type" "EmailType" NOT NULL,
    "status" "EmailStatus" NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailLog_createdAt_idx" ON "EmailLog"("createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_tenantId_createdAt_idx" ON "EmailLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_status_createdAt_idx" ON "EmailLog"("status", "createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_type_createdAt_idx" ON "EmailLog"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "EmailLog"
ADD CONSTRAINT "EmailLog_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
