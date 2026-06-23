-- CreateTable
CREATE TABLE "Tenant" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "logoUrl" TEXT,
    "themeColors" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianUser" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "rut" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardianUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" UUID NOT NULL,
    "guardianId" UUID NOT NULL,
    "buyOrder" TEXT NOT NULL,
    "sessionId" TEXT,
    "tokenWs" TEXT,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "authorizationCode" TEXT,
    "edupayPayload" JSONB,
    "edupaySynced" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_domain_key" ON "Tenant"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "GuardianUser_tenantId_rut_key" ON "GuardianUser"("tenantId", "rut");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_buyOrder_key" ON "Transaction"("buyOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_tokenWs_key" ON "Transaction"("tokenWs");

-- AddForeignKey
ALTER TABLE "GuardianUser" ADD CONSTRAINT "GuardianUser_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "GuardianUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
