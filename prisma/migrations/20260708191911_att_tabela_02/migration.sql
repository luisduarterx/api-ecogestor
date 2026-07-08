/*
  Warnings:

  - A unique constraint covering the columns `[tabelaID,materialID]` on the table `PrecoPorTabela` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PrecoPorTabela_tabelaID_materialID_key" ON "PrecoPorTabela"("tabelaID", "materialID");
