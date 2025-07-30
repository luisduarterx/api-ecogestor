/*
  Warnings:

  - You are about to drop the column `fechadoPorID` on the `LivroCaixa` table. All the data in the column will be lost.
  - Made the column `saldoFinal` on table `LivroCaixa` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "LivroCaixa" DROP CONSTRAINT "LivroCaixa_fechadoPorID_fkey";

-- AlterTable
ALTER TABLE "LivroCaixa" DROP COLUMN "fechadoPorID",
ALTER COLUMN "saldoFinal" SET NOT NULL;

-- CreateTable
CREATE TABLE "Fechamento" (
    "id" SERIAL NOT NULL,
    "caixaID" INTEGER NOT NULL,
    "valor_abertura" DECIMAL(65,30) NOT NULL,
    "valor_abastecimentos" DECIMAL(65,30) NOT NULL,
    "valor_despesas" DECIMAL(65,30) NOT NULL,
    "data_abertura" TIMESTAMP(3) NOT NULL,
    "data_fechamento" TIMESTAMP(3) NOT NULL,
    "userID_fechamento" INTEGER NOT NULL,
    "valor_esperado" DECIMAL(65,30) NOT NULL,
    "valor_conferido" DECIMAL(65,30) NOT NULL,
    "valor_diferenca" DECIMAL(65,30),
    "valor_pago" DECIMAL(65,30) NOT NULL,
    "valor_recebido" DECIMAL(65,30) NOT NULL,
    "valor_total_compras" DECIMAL(65,30) NOT NULL,
    "valor_total_vendas" DECIMAL(65,30) NOT NULL,
    "peso_total_compras" DECIMAL(65,30) NOT NULL,
    "peso_total_vendas" DECIMAL(65,30) NOT NULL,
    "lucro_total" DECIMAL(65,30) NOT NULL,
    "proj_lucro" DECIMAL(65,30) NOT NULL,
    "proj_venda" DECIMAL(65,30) NOT NULL,
    "qnt_compras" DECIMAL(65,30) NOT NULL,
    "qnt_vendas" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Fechamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Fechamento_caixaID_key" ON "Fechamento"("caixaID");

-- AddForeignKey
ALTER TABLE "Fechamento" ADD CONSTRAINT "Fechamento_caixaID_fkey" FOREIGN KEY ("caixaID") REFERENCES "LivroCaixa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fechamento" ADD CONSTRAINT "Fechamento_userID_fechamento_fkey" FOREIGN KEY ("userID_fechamento") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
