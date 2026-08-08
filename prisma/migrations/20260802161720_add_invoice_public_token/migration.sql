-- AlterTable
-- La tabla invoices está vacía al momento de esta migración (verificado
-- antes de escribirla), por eso se agrega la columna directamente como
-- NOT NULL sin paso de backfill intermedio.
ALTER TABLE "invoices" ADD COLUMN "publicToken" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "invoices_publicToken_key" ON "invoices"("publicToken");
