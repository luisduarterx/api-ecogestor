/*
  Warnings:

  - You are about to drop the column `origem` on the `MovimentacaoFinanceira` table. All the data in the column will be lost.
  - You are about to drop the column `origemID` on the `MovimentacaoFinanceira` table. All the data in the column will be lost.
  - You are about to drop the `Conta` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Pagamento` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[contaID]` on the table `MovimentacaoFinanceira` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `categoriaID` to the `MovimentacaoFinanceira` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoConta" AS ENUM ('PAGAR', 'RECEBER');

-- DropForeignKey
ALTER TABLE "MovimentacaoFinanceira" DROP CONSTRAINT "MovimentacaoFinanceira_contaID_fkey";

-- DropForeignKey
ALTER TABLE "Pagamento" DROP CONSTRAINT "Pagamento_pedidoID_fkey";

-- AlterTable
ALTER TABLE "MovimentacaoFinanceira" DROP COLUMN "origem",
DROP COLUMN "origemID",
ADD COLUMN     "bancoID" INTEGER,
ADD COLUMN     "categoriaID" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Conta";

-- DropTable
DROP TABLE "Pagamento";

-- CreateTable
CREATE TABLE "ContaFinanceira" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoConta" NOT NULL,
    "pedidoID" INTEGER,
    "registroID" INTEGER,
    "descricao" TEXT,
    "valor" DECIMAL(65,30) NOT NULL,
    "data_documento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_vencimento" TIMESTAMP(3),
    "data_pagamento" TIMESTAMP(3),
    "forma" "FormaPagamento" NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContaFinanceira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banco" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "saldo" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Banco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaCaixa" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CategoriaCaixa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MovimentacaoFinanceira_contaID_key" ON "MovimentacaoFinanceira"("contaID");

-- AddForeignKey
ALTER TABLE "ContaFinanceira" ADD CONSTRAINT "ContaFinanceira_pedidoID_fkey" FOREIGN KEY ("pedidoID") REFERENCES "Pedido"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaFinanceira" ADD CONSTRAINT "ContaFinanceira_registroID_fkey" FOREIGN KEY ("registroID") REFERENCES "Registro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoFinanceira" ADD CONSTRAINT "MovimentacaoFinanceira_contaID_fkey" FOREIGN KEY ("contaID") REFERENCES "ContaFinanceira"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoFinanceira" ADD CONSTRAINT "MovimentacaoFinanceira_categoriaID_fkey" FOREIGN KEY ("categoriaID") REFERENCES "CategoriaCaixa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoFinanceira" ADD CONSTRAINT "MovimentacaoFinanceira_bancoID_fkey" FOREIGN KEY ("bancoID") REFERENCES "Banco"("id") ON DELETE SET NULL ON UPDATE CASCADE;
