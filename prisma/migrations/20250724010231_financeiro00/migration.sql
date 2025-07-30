/*
  Warnings:

  - You are about to drop the column `usuarioID` on the `LivroCaixa` table. All the data in the column will be lost.
  - Added the required column `abertoPorID` to the `LivroCaixa` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "LivroCaixa" DROP CONSTRAINT "LivroCaixa_usuarioID_fkey";

-- AlterTable
ALTER TABLE "LivroCaixa" DROP COLUMN "usuarioID",
ADD COLUMN     "abertoPorID" INTEGER NOT NULL,
ADD COLUMN     "fechadoPorID" INTEGER;

-- AddForeignKey
ALTER TABLE "LivroCaixa" ADD CONSTRAINT "LivroCaixa_abertoPorID_fkey" FOREIGN KEY ("abertoPorID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivroCaixa" ADD CONSTRAINT "LivroCaixa_fechadoPorID_fkey" FOREIGN KEY ("fechadoPorID") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
