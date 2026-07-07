/*
  Warnings:

  - Added the required column `descricao` to the `Banco` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Banco" ADD COLUMN     "descricao" TEXT NOT NULL,
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;
