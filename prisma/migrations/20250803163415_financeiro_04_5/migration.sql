/*
  Warnings:

  - You are about to drop the column `saldoAtual` on the `MovimentacaoFinanceira` table. All the data in the column will be lost.
  - You are about to drop the column `tipoMovimentacao` on the `MovimentacaoFinanceira` table. All the data in the column will be lost.
  - Added the required column `saldoInicial` to the `MovimentacaoFinanceira` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipoMovimentacaoID` to the `MovimentacaoFinanceira` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DirecaoFinanceira" AS ENUM ('ENTRADA', 'SAIDA');

-- DropForeignKey
ALTER TABLE "MovimentacaoFinanceira" DROP CONSTRAINT "MovimentacaoFinanceira_categoriaID_fkey";

-- AlterTable
ALTER TABLE "MovimentacaoFinanceira" DROP COLUMN "saldoAtual",
DROP COLUMN "tipoMovimentacao",
ADD COLUMN     "saldoInicial" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "tipoMovimentacaoID" INTEGER NOT NULL,
ALTER COLUMN "categoriaID" DROP NOT NULL;

-- DropEnum
DROP TYPE "TipoMovimentacao";

-- CreateTable
CREATE TABLE "Caixa_TipoMovimentacao" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "DirecaoFinanceira" NOT NULL,

    CONSTRAINT "Caixa_TipoMovimentacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Caixa_TipoMovimentacao_nome_key" ON "Caixa_TipoMovimentacao"("nome");

-- AddForeignKey
ALTER TABLE "MovimentacaoFinanceira" ADD CONSTRAINT "MovimentacaoFinanceira_categoriaID_fkey" FOREIGN KEY ("categoriaID") REFERENCES "CategoriaCaixa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoFinanceira" ADD CONSTRAINT "MovimentacaoFinanceira_tipoMovimentacaoID_fkey" FOREIGN KEY ("tipoMovimentacaoID") REFERENCES "Caixa_TipoMovimentacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
