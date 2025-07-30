-- DropForeignKey
ALTER TABLE "MovimentacaoFinanceira" DROP CONSTRAINT "MovimentacaoFinanceira_contaID_fkey";

-- AlterTable
ALTER TABLE "MovimentacaoFinanceira" ALTER COLUMN "contaID" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "MovimentacaoFinanceira" ADD CONSTRAINT "MovimentacaoFinanceira_contaID_fkey" FOREIGN KEY ("contaID") REFERENCES "Conta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
