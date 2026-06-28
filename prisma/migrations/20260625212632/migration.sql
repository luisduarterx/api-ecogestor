/*
  Warnings:

  - You are about to drop the column `name` on the `CategoriaMaterial` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nome]` on the table `CategoriaMaterial` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nome` to the `CategoriaMaterial` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "CategoriaMaterial_name_key";

-- AlterTable
ALTER TABLE "CategoriaMaterial" DROP COLUMN "name",
ADD COLUMN     "nome" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaMaterial_nome_key" ON "CategoriaMaterial"("nome");
