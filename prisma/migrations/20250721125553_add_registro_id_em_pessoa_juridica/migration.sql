/*
  Warnings:

  - A unique constraint covering the columns `[registroID]` on the table `PessoaJuridica` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `registroID` to the `PessoaJuridica` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PessoaJuridica" DROP CONSTRAINT "PessoaJuridica_id_fkey";

-- AlterTable
ALTER TABLE "PessoaJuridica" ADD COLUMN     "registroID" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PessoaJuridica_registroID_key" ON "PessoaJuridica"("registroID");

-- AddForeignKey
ALTER TABLE "PessoaJuridica" ADD CONSTRAINT "PessoaJuridica_registroID_fkey" FOREIGN KEY ("registroID") REFERENCES "Registro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
