-- CreateEnum
CREATE TYPE "AutomationRuleType" AS ENUM ('FACTURAS_POR_VENCER', 'LEADS_SIN_SEGUIMIENTO');

-- AlterTable
ALTER TABLE "resources" ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "sizeBytes" INTEGER;

-- AlterTable
ALTER TABLE "automation_rules" ADD COLUMN     "daysThreshold" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "lastRunAt" TIMESTAMP(3),
ADD COLUMN     "type" "AutomationRuleType" NOT NULL DEFAULT 'FACTURAS_POR_VENCER';
