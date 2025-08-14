/*
  Warnings:

  - Added the required column `userID` to the `MovimentacaoFinanceira` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MovimentacaoFinanceira" ADD COLUMN     "userID" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "MovimentacaoFinanceira" ADD CONSTRAINT "MovimentacaoFinanceira_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
