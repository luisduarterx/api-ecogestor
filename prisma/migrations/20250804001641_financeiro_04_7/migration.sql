/*
  Warnings:

  - You are about to drop the column `lucro_total` on the `Fechamento` table. All the data in the column will be lost.
  - You are about to drop the column `peso_total_compras` on the `Fechamento` table. All the data in the column will be lost.
  - You are about to drop the column `peso_total_vendas` on the `Fechamento` table. All the data in the column will be lost.
  - You are about to drop the column `proj_lucro` on the `Fechamento` table. All the data in the column will be lost.
  - You are about to drop the column `proj_venda` on the `Fechamento` table. All the data in the column will be lost.
  - You are about to drop the column `qnt_compras` on the `Fechamento` table. All the data in the column will be lost.
  - You are about to drop the column `qnt_vendas` on the `Fechamento` table. All the data in the column will be lost.
  - You are about to drop the column `valor_pago` on the `Fechamento` table. All the data in the column will be lost.
  - You are about to drop the column `valor_recebido` on the `Fechamento` table. All the data in the column will be lost.
  - You are about to drop the column `valor_total_compras` on the `Fechamento` table. All the data in the column will be lost.
  - You are about to drop the column `valor_total_vendas` on the `Fechamento` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Fechamento" DROP COLUMN "lucro_total",
DROP COLUMN "peso_total_compras",
DROP COLUMN "peso_total_vendas",
DROP COLUMN "proj_lucro",
DROP COLUMN "proj_venda",
DROP COLUMN "qnt_compras",
DROP COLUMN "qnt_vendas",
DROP COLUMN "valor_pago",
DROP COLUMN "valor_recebido",
DROP COLUMN "valor_total_compras",
DROP COLUMN "valor_total_vendas";
