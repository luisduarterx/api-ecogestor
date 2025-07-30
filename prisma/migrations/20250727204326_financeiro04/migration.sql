/*
  Warnings:

  - Added the required column `saldoAtual` to the `MovimentacaoFinanceira` table without a default value. This is not possible if the table is not empty.
  - Added the required column `saldoFinal` to the `MovimentacaoFinanceira` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MovimentacaoFinanceira" ADD COLUMN     "saldoAtual" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "saldoFinal" DECIMAL(65,30) NOT NULL;
