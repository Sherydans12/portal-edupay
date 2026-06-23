-- AlterTable
ALTER TABLE "GuardianUser" ADD COLUMN     "email" TEXT,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);
