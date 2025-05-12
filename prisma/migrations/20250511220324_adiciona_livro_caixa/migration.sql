/*
  Warnings:

  - You are about to drop the column `origemId` on the `MovimentacaoFinanceira` table. All the data in the column will be lost.
  - Added the required column `caixaID` to the `MovimentacaoFinanceira` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StatusCaixa" AS ENUM ('ABERTO', 'FECHADO');

-- AlterTable
ALTER TABLE "MovimentacaoFinanceira" DROP COLUMN "origemId",
ADD COLUMN     "caixaID" INTEGER NOT NULL,
ADD COLUMN     "origemID" INTEGER;

-- CreateTable
CREATE TABLE "LivroCaixa" (
    "id" SERIAL NOT NULL,
    "dataAbertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFechamento" TIMESTAMP(3),
    "saldoInicial" DECIMAL(65,30) NOT NULL,
    "saldoFinal" DECIMAL(65,30),
    "status" "StatusCaixa" NOT NULL DEFAULT 'ABERTO',
    "usuarioID" INTEGER NOT NULL,

    CONSTRAINT "LivroCaixa_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MovimentacaoFinanceira" ADD CONSTRAINT "MovimentacaoFinanceira_caixaID_fkey" FOREIGN KEY ("caixaID") REFERENCES "LivroCaixa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivroCaixa" ADD CONSTRAINT "LivroCaixa_usuarioID_fkey" FOREIGN KEY ("usuarioID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
