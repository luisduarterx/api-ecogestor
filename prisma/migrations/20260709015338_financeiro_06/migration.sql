/*
  Warnings:

  - A unique constraint covering the columns `[estorno_de_id]` on the table `MovimentacaoFinanceira` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[estorno_de_id]` on the table `TransferenciaFinanceira` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MovimentacaoFinanceira_estorno_de_id_key" ON "MovimentacaoFinanceira"("estorno_de_id");

-- CreateIndex
CREATE UNIQUE INDEX "TransferenciaFinanceira_estorno_de_id_key" ON "TransferenciaFinanceira"("estorno_de_id");
