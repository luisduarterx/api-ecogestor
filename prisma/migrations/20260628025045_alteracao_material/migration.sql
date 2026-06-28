/*
  Warnings:

  - You are about to drop the column `v_venda` on the `Material` table. All the data in the column will be lost.
  - Added the required column `preco_venda` to the `Material` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Material" DROP COLUMN "v_venda",
ADD COLUMN     "preco_venda" DECIMAL(10,2) NOT NULL,
ALTER COLUMN "estoque" SET DEFAULT 0;
