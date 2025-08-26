/*
  Warnings:

  - You are about to drop the column `conversaoEstoqueId` on the `MovimentacaoEstoque` table. All the data in the column will be lost.
  - You are about to drop the column `origemTipo` on the `MovimentacaoEstoque` table. All the data in the column will be lost.
  - You are about to drop the column `tipo` on the `MovimentacaoEstoque` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[devolucaoID]` on the table `MovimentacaoEstoque` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `tipo` on the `Caixa_TipoMovimentacao` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `pesoBruto` to the `ItemPedido` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `ItemPedido` table without a default value. This is not possible if the table is not empty.
  - Added the required column `origem` to the `MovimentacaoEstoque` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipoMovimentacao` to the `MovimentacaoEstoque` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DirecaoMovimentacao" AS ENUM ('ENTRADA', 'SAIDA');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrigemMovimentacaoEstoque" ADD VALUE 'AVULSO';
ALTER TYPE "OrigemMovimentacaoEstoque" ADD VALUE 'DEVOLUCAO';

-- DropForeignKey
ALTER TABLE "MovimentacaoEstoque" DROP CONSTRAINT "MovimentacaoEstoque_conversaoEstoqueId_fkey";

-- AlterTable
ALTER TABLE "Caixa_TipoMovimentacao" DROP COLUMN "tipo",
ADD COLUMN     "tipo" "DirecaoMovimentacao" NOT NULL;

-- AlterTable
ALTER TABLE "ItemPedido" ADD COLUMN     "pesoBruto" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "subtotal" DECIMAL(65,30) NOT NULL;

-- AlterTable
ALTER TABLE "MovimentacaoEstoque" DROP COLUMN "conversaoEstoqueId",
DROP COLUMN "origemTipo",
DROP COLUMN "tipo",
ADD COLUMN     "devolucaoID" INTEGER,
ADD COLUMN     "devolvidaEm" TIMESTAMP(3),
ADD COLUMN     "observacao" TEXT,
ADD COLUMN     "origem" "OrigemMovimentacaoEstoque" NOT NULL,
ADD COLUMN     "tipoMovimentacao" "DirecaoMovimentacao" NOT NULL;

-- DropEnum
DROP TYPE "DirecaoFinanceira";

-- CreateIndex
CREATE UNIQUE INDEX "MovimentacaoEstoque_devolucaoID_key" ON "MovimentacaoEstoque"("devolucaoID");

-- AddForeignKey
ALTER TABLE "MovimentacaoEstoque" ADD CONSTRAINT "MovimentacaoEstoque_devolucaoID_fkey" FOREIGN KEY ("devolucaoID") REFERENCES "MovimentacaoEstoque"("id") ON DELETE SET NULL ON UPDATE CASCADE;
