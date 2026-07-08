/*
  Warnings:

  - You are about to drop the column `data` on the `ContaFinanceira` table. All the data in the column will be lost.
  - You are about to drop the column `data_documento` on the `ContaFinanceira` table. All the data in the column will be lost.
  - You are about to drop the column `data_pagamento` on the `ContaFinanceira` table. All the data in the column will be lost.
  - You are about to drop the column `data_vencimento` on the `ContaFinanceira` table. All the data in the column will be lost.
  - You are about to drop the column `descricao` on the `ContaFinanceira` table. All the data in the column will be lost.
  - You are about to drop the column `forma` on the `ContaFinanceira` table. All the data in the column will be lost.
  - You are about to drop the column `pedidoID` on the `ContaFinanceira` table. All the data in the column will be lost.
  - You are about to drop the column `registroID` on the `ContaFinanceira` table. All the data in the column will be lost.
  - You are about to drop the column `tipo` on the `ContaFinanceira` table. All the data in the column will be lost.
  - You are about to drop the column `valor` on the `ContaFinanceira` table. All the data in the column will be lost.
  - You are about to drop the column `bancoID` on the `MovimentacaoFinanceira` table. All the data in the column will be lost.
  - You are about to drop the column `caixaID` on the `MovimentacaoFinanceira` table. All the data in the column will be lost.
  - You are about to drop the column `categoriaID` on the `MovimentacaoFinanceira` table. All the data in the column will be lost.
  - You are about to drop the column `contaID` on the `MovimentacaoFinanceira` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `MovimentacaoFinanceira` table. All the data in the column will be lost.
  - You are about to drop the column `estornadoEm` on the `MovimentacaoFinanceira` table. All the data in the column will be lost.
  - You are about to drop the column `estornoID` on the `MovimentacaoFinanceira` table. All the data in the column will be lost.
  - You are about to drop the column `saldoFinal` on the `MovimentacaoFinanceira` table. All the data in the column will be lost.
  - You are about to drop the column `saldoInicial` on the `MovimentacaoFinanceira` table. All the data in the column will be lost.
  - You are about to drop the column `tipoMovimentacaoID` on the `MovimentacaoFinanceira` table. All the data in the column will be lost.
  - You are about to drop the column `userID` on the `MovimentacaoFinanceira` table. All the data in the column will be lost.
  - You are about to drop the `Banco` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Caixa_TipoMovimentacao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CategoriaCaixa` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Fechamento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LivroCaixa` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[nome]` on the table `ContaFinanceira` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `atualizado_em` to the `ContaFinanceira` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nome` to the `ContaFinanceira` table without a default value. This is not possible if the table is not empty.
  - Added the required column `saldo_atual` to the `ContaFinanceira` table without a default value. This is not possible if the table is not empty.
  - Added the required column `saldo_inicial` to the `ContaFinanceira` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `tipoMovimentacao` on the `MovimentacaoEstoque` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `conta_id` to the `MovimentacaoFinanceira` table without a default value. This is not possible if the table is not empty.
  - Added the required column `direcao` to the `MovimentacaoFinanceira` table without a default value. This is not possible if the table is not empty.
  - Added the required column `origem` to the `MovimentacaoFinanceira` table without a default value. This is not possible if the table is not empty.
  - Added the required column `saldo_final` to the `MovimentacaoFinanceira` table without a default value. This is not possible if the table is not empty.
  - Added the required column `saldo_inical` to the `MovimentacaoFinanceira` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `MovimentacaoFinanceira` table without a default value. This is not possible if the table is not empty.
  - Made the column `descricao` on table `MovimentacaoFinanceira` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "StatusLancamento" AS ENUM ('ABERTO', 'PAGO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoLancamento" AS ENUM ('PAGAR', 'RECEBER');

-- CreateEnum
CREATE TYPE "OrigemMovimentacao" AS ENUM ('PEDIDO_COMPRA', 'PEDIDO_VENDA', 'TRANSFERENCIA', 'LANCAMENTO_PAGAR', 'LANCAMENTO_RECEBER', 'AJUSTE_MANUAL', 'ABERTURA_CAIXA', 'FECHAMENTO_CAIXA', 'ESTORNO');

-- CreateEnum
CREATE TYPE "DirecaoFinanceira" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "TipoCategoria" AS ENUM ('RECEITA', 'DESPESA');

-- DropForeignKey
ALTER TABLE "ContaFinanceira" DROP CONSTRAINT "ContaFinanceira_pedidoID_fkey";

-- DropForeignKey
ALTER TABLE "ContaFinanceira" DROP CONSTRAINT "ContaFinanceira_registroID_fkey";

-- DropForeignKey
ALTER TABLE "Fechamento" DROP CONSTRAINT "Fechamento_caixaID_fkey";

-- DropForeignKey
ALTER TABLE "Fechamento" DROP CONSTRAINT "Fechamento_userID_fechamento_fkey";

-- DropForeignKey
ALTER TABLE "LivroCaixa" DROP CONSTRAINT "LivroCaixa_abertoPorID_fkey";

-- DropForeignKey
ALTER TABLE "MovimentacaoFinanceira" DROP CONSTRAINT "MovimentacaoFinanceira_bancoID_fkey";

-- DropForeignKey
ALTER TABLE "MovimentacaoFinanceira" DROP CONSTRAINT "MovimentacaoFinanceira_caixaID_fkey";

-- DropForeignKey
ALTER TABLE "MovimentacaoFinanceira" DROP CONSTRAINT "MovimentacaoFinanceira_categoriaID_fkey";

-- DropForeignKey
ALTER TABLE "MovimentacaoFinanceira" DROP CONSTRAINT "MovimentacaoFinanceira_contaID_fkey";

-- DropForeignKey
ALTER TABLE "MovimentacaoFinanceira" DROP CONSTRAINT "MovimentacaoFinanceira_estornoID_fkey";

-- DropForeignKey
ALTER TABLE "MovimentacaoFinanceira" DROP CONSTRAINT "MovimentacaoFinanceira_tipoMovimentacaoID_fkey";

-- DropForeignKey
ALTER TABLE "MovimentacaoFinanceira" DROP CONSTRAINT "MovimentacaoFinanceira_userID_fkey";

-- DropForeignKey
ALTER TABLE "Pedido" DROP CONSTRAINT "Pedido_caixaID_fkey";

-- DropIndex
DROP INDEX "MovimentacaoFinanceira_contaID_key";

-- DropIndex
DROP INDEX "MovimentacaoFinanceira_estornoID_key";

-- AlterTable
ALTER TABLE "ContaFinanceira" DROP COLUMN "data",
DROP COLUMN "data_documento",
DROP COLUMN "data_pagamento",
DROP COLUMN "data_vencimento",
DROP COLUMN "descricao",
DROP COLUMN "forma",
DROP COLUMN "pedidoID",
DROP COLUMN "registroID",
DROP COLUMN "tipo",
DROP COLUMN "valor",
ADD COLUMN     "atualizado_em" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "conta_padrao" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "nome" TEXT NOT NULL,
ADD COLUMN     "saldo_atual" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "saldo_inicial" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "MovimentacaoEstoque" DROP COLUMN "tipoMovimentacao",
ADD COLUMN     "tipoMovimentacao" "TipoMovimentacaoEstoque" NOT NULL;

-- AlterTable
ALTER TABLE "MovimentacaoFinanceira" DROP COLUMN "bancoID",
DROP COLUMN "caixaID",
DROP COLUMN "categoriaID",
DROP COLUMN "contaID",
DROP COLUMN "data",
DROP COLUMN "estornadoEm",
DROP COLUMN "estornoID",
DROP COLUMN "saldoFinal",
DROP COLUMN "saldoInicial",
DROP COLUMN "tipoMovimentacaoID",
DROP COLUMN "userID",
ADD COLUMN     "caixa_id" INTEGER,
ADD COLUMN     "conta_id" INTEGER NOT NULL,
ADD COLUMN     "direcao" "DirecaoFinanceira" NOT NULL,
ADD COLUMN     "estornada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "estorno_de_id" INTEGER,
ADD COLUMN     "lancamento_id" INTEGER,
ADD COLUMN     "motivo_ajuste" TEXT,
ADD COLUMN     "origem" "OrigemMovimentacao" NOT NULL,
ADD COLUMN     "origem_id" INTEGER,
ADD COLUMN     "saldo_final" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "saldo_inical" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "transferencia_id" INTEGER,
ADD COLUMN     "user_id" INTEGER NOT NULL,
ALTER COLUMN "descricao" SET NOT NULL;

-- DropTable
DROP TABLE "Banco";

-- DropTable
DROP TABLE "Caixa_TipoMovimentacao";

-- DropTable
DROP TABLE "CategoriaCaixa";

-- DropTable
DROP TABLE "Fechamento";

-- DropTable
DROP TABLE "LivroCaixa";

-- DropEnum
DROP TYPE "DirecaoMovimentacao";

-- DropEnum
DROP TYPE "TipoConta";

-- CreateTable
CREATE TABLE "CategoriaLancamento" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "TipoCategoria" "TipoCategoria" NOT NULL,

    CONSTRAINT "CategoriaLancamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LancamentoFinanceiro" (
    "id" SERIAL NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" "TipoLancamento" NOT NULL,
    "titulo" TEXT NOT NULL,
    "parcela" INTEGER,
    "status" "StatusLancamento" NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "data_baixa" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "desconto" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "acrescimo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "user_id" INTEGER NOT NULL,
    "registro_id" INTEGER,
    "pedido_id" INTEGER,

    CONSTRAINT "LancamentoFinanceiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferenciaFinanceira" (
    "id" SERIAL NOT NULL,
    "conta_origem_id" INTEGER NOT NULL,
    "conta_destino_id" INTEGER NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "descricao" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "caixa_id" INTEGER,

    CONSTRAINT "TransferenciaFinanceira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Caixa" (
    "id" SERIAL NOT NULL,
    "conta_id" INTEGER NOT NULL,
    "usuario_abertura_id" INTEGER NOT NULL,
    "usuario_fechamento_id" INTEGER,
    "status" "StatusCaixa" NOT NULL DEFAULT 'ABERTO',
    "saldo_inicial" DECIMAL(10,2) NOT NULL,
    "saldo_final_sistema" DECIMAL(10,2),
    "saldo_final_informado" DECIMAL(10,2),
    "diferenca" DECIMAL(10,2),
    "aberto_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechado_em" TIMESTAMP(3),
    "observacao_abertura" TEXT,
    "observacao_fechamento" TEXT,

    CONSTRAINT "Caixa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContaFinanceira_nome_key" ON "ContaFinanceira"("nome");

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_caixaID_fkey" FOREIGN KEY ("caixaID") REFERENCES "Caixa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoFinanceiro" ADD CONSTRAINT "LancamentoFinanceiro_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "CategoriaLancamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoFinanceiro" ADD CONSTRAINT "LancamentoFinanceiro_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoFinanceiro" ADD CONSTRAINT "LancamentoFinanceiro_registro_id_fkey" FOREIGN KEY ("registro_id") REFERENCES "Registro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LancamentoFinanceiro" ADD CONSTRAINT "LancamentoFinanceiro_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "Pedido"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoFinanceira" ADD CONSTRAINT "MovimentacaoFinanceira_conta_id_fkey" FOREIGN KEY ("conta_id") REFERENCES "ContaFinanceira"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoFinanceira" ADD CONSTRAINT "MovimentacaoFinanceira_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoFinanceira" ADD CONSTRAINT "MovimentacaoFinanceira_lancamento_id_fkey" FOREIGN KEY ("lancamento_id") REFERENCES "LancamentoFinanceiro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoFinanceira" ADD CONSTRAINT "MovimentacaoFinanceira_transferencia_id_fkey" FOREIGN KEY ("transferencia_id") REFERENCES "TransferenciaFinanceira"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoFinanceira" ADD CONSTRAINT "MovimentacaoFinanceira_estorno_de_id_fkey" FOREIGN KEY ("estorno_de_id") REFERENCES "MovimentacaoFinanceira"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoFinanceira" ADD CONSTRAINT "MovimentacaoFinanceira_caixa_id_fkey" FOREIGN KEY ("caixa_id") REFERENCES "Caixa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaFinanceira" ADD CONSTRAINT "TransferenciaFinanceira_conta_origem_id_fkey" FOREIGN KEY ("conta_origem_id") REFERENCES "ContaFinanceira"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaFinanceira" ADD CONSTRAINT "TransferenciaFinanceira_conta_destino_id_fkey" FOREIGN KEY ("conta_destino_id") REFERENCES "ContaFinanceira"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaFinanceira" ADD CONSTRAINT "TransferenciaFinanceira_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaFinanceira" ADD CONSTRAINT "TransferenciaFinanceira_caixa_id_fkey" FOREIGN KEY ("caixa_id") REFERENCES "Caixa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caixa" ADD CONSTRAINT "Caixa_conta_id_fkey" FOREIGN KEY ("conta_id") REFERENCES "ContaFinanceira"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caixa" ADD CONSTRAINT "Caixa_usuario_abertura_id_fkey" FOREIGN KEY ("usuario_abertura_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caixa" ADD CONSTRAINT "Caixa_usuario_fechamento_id_fkey" FOREIGN KEY ("usuario_fechamento_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
