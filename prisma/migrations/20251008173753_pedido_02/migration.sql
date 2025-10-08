/*
  Warnings:

  - A unique constraint covering the columns `[nome]` on the table `Material` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `caixaID` to the `Pedido` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Pedido" ADD COLUMN     "caixaID" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Material_nome_key" ON "public"."Material"("nome");

-- AddForeignKey
ALTER TABLE "public"."Pedido" ADD CONSTRAINT "Pedido_caixaID_fkey" FOREIGN KEY ("caixaID") REFERENCES "public"."LivroCaixa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
