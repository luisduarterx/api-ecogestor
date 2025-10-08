/*
  Warnings:

  - You are about to drop the column `valor_pago` on the `Fechamento` table. All the data in the column will be lost.
  - You are about to drop the column `valor_recebido` on the `Fechamento` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Fechamento" DROP COLUMN "valor_pago",
DROP COLUMN "valor_recebido";
