-- CreateEnum
CREATE TYPE "AiProvider" AS ENUM ('ANTHROPIC', 'OPENAI', 'GOOGLE');

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "aiApiKeyEncrypted" TEXT,
ADD COLUMN     "aiProvider" "AiProvider";
