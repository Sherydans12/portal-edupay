-- AlterTable
ALTER TABLE "GuardianUser"
ADD COLUMN "pendingEmail" TEXT,
ADD COLUMN "emailChangeTokenHash" TEXT,
ADD COLUMN "emailChangeTokenExpiry" TIMESTAMP(3),
ADD COLUMN "edupayUpdatedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "EdupayWebhookEvent" (
    "eventId" UUID NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "guardianRut" TEXT NOT NULL,
    "guardianEmail" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EdupayWebhookEvent_pkey" PRIMARY KEY ("eventId")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuardianUser_emailChangeTokenHash_key"
ON "GuardianUser"("emailChangeTokenHash");

-- CreateIndex
CREATE INDEX "EdupayWebhookEvent_tenantId_guardianRut_idx"
ON "EdupayWebhookEvent"("tenantId", "guardianRut");

-- CreateIndex
CREATE INDEX "EdupayWebhookEvent_createdAt_idx"
ON "EdupayWebhookEvent"("createdAt");
