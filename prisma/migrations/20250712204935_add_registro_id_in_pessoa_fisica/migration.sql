/*
  Warnings:

  - A unique constraint covering the columns `[registroID]` on the table `PessoaFisica` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `registroID` to the `PessoaFisica` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PessoaFisica" DROP CONSTRAINT "PessoaFisica_id_fkey";

-- AlterTable
ALTER TABLE "PessoaFisica" ADD COLUMN     "registroID" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PessoaFisica_registroID_key" ON "PessoaFisica"("registroID");

-- AddForeignKey
ALTER TABLE "PessoaFisica" ADD CONSTRAINT "PessoaFisica_registroID_fkey" FOREIGN KEY ("registroID") REFERENCES "Registro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
