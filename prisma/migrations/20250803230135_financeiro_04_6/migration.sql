/*
  Warnings:

  - A unique constraint covering the columns `[estornoID]` on the table `MovimentacaoFinanceira` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "MovimentacaoFinanceira" ADD COLUMN     "estornoID" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "MovimentacaoFinanceira_estornoID_key" ON "MovimentacaoFinanceira"("estornoID");

-- AddForeignKey
ALTER TABLE "MovimentacaoFinanceira" ADD CONSTRAINT "MovimentacaoFinanceira_estornoID_fkey" FOREIGN KEY ("estornoID") REFERENCES "MovimentacaoFinanceira"("id") ON DELETE SET NULL ON UPDATE CASCADE;
