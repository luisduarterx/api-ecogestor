/*
  Warnings:

  - You are about to drop the column `saldo_inical` on the `MovimentacaoFinanceira` table. All the data in the column will be lost.
  - Added the required column `saldo_inicial` to the `MovimentacaoFinanceira` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MovimentacaoFinanceira" DROP COLUMN "saldo_inical",
ADD COLUMN     "saldo_inicial" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "TransferenciaFinanceira" ADD COLUMN     "estornada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "estorno_de_id" INTEGER;

-- AddForeignKey
ALTER TABLE "TransferenciaFinanceira" ADD CONSTRAINT "TransferenciaFinanceira_estorno_de_id_fkey" FOREIGN KEY ("estorno_de_id") REFERENCES "TransferenciaFinanceira"("id") ON DELETE SET NULL ON UPDATE CASCADE;
