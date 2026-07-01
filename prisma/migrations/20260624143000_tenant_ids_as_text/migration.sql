ALTER TABLE "GuardianUser"
DROP CONSTRAINT "GuardianUser_tenantId_fkey";

ALTER TABLE "Transaction"
DROP CONSTRAINT "Transaction_tenantId_fkey";

ALTER TABLE "Tenant"
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" TYPE TEXT USING "id"::TEXT;

ALTER TABLE "GuardianUser"
ALTER COLUMN "tenantId" TYPE TEXT USING "tenantId"::TEXT;

ALTER TABLE "Transaction"
ALTER COLUMN "tenantId" TYPE TEXT USING "tenantId"::TEXT;

ALTER TABLE "GuardianUser"
ADD CONSTRAINT "GuardianUser_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Transaction"
ADD CONSTRAINT "Transaction_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
