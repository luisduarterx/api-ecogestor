/*
  Warnings:

  - You are about to drop the column `categoria` on the `MovimentacaoFinanceira` table. All the data in the column will be lost.
  - You are about to drop the column `categoria` on the `Pagamento` table. All the data in the column will be lost.
  - You are about to drop the column `contaID` on the `Pagamento` table. All the data in the column will be lost.
  - You are about to drop the column `descricao` on the `Pagamento` table. All the data in the column will be lost.
  - Added the required column `origem` to the `MovimentacaoFinanceira` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoOrigem" AS ENUM ('PEDIDO', 'ABASTECIMENTO', 'RETIRADA', 'DESPESA');

-- DropForeignKey
ALTER TABLE "Pagamento" DROP CONSTRAINT "Pagamento_contaID_fkey";

-- AlterTable
ALTER TABLE "MovimentacaoFinanceira" DROP COLUMN "categoria",
ADD COLUMN     "origem" "TipoOrigem" NOT NULL;

-- AlterTable
ALTER TABLE "Pagamento" DROP COLUMN "categoria",
DROP COLUMN "contaID",
DROP COLUMN "descricao";

-- DropEnum
DROP TYPE "CategoriaMovimentacao";
