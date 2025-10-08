/*
  Warnings:

  - You are about to alter the column `saldo` on the `Banco` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `valor` on the `ContaFinanceira` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `quantidade` on the `ConversaoEstoque` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to drop the column `valor_conferido` on the `Fechamento` table. All the data in the column will be lost.
  - You are about to drop the column `valor_diferenca` on the `Fechamento` table. All the data in the column will be lost.
  - You are about to alter the column `valor_abertura` on the `Fechamento` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `valor_abastecimentos` on the `Fechamento` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `valor_despesas` on the `Fechamento` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `valor_esperado` on the `Fechamento` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `preco` on the `ItemPedido` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `quantidade` on the `ItemPedido` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `tara` on the `ItemPedido` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `impureza` on the `ItemPedido` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `pesoBruto` on the `ItemPedido` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `subtotal` on the `ItemPedido` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `saldoInicial` on the `LivroCaixa` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `saldoFinal` on the `LivroCaixa` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `v_venda` on the `Material` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `estoque` on the `Material` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `quantidade` on the `MovimentacaoEstoque` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `valor` on the `MovimentacaoFinanceira` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `saldoFinal` on the `MovimentacaoFinanceira` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `saldoInicial` on the `MovimentacaoFinanceira` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `valor_total` on the `Pedido` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `v_compra` on the `PrecoPorTabela` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to alter the column `saldo` on the `SaldoFinanceiro` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - Added the required column `peso_total_compras` to the `Fechamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `peso_total_vendas` to the `Fechamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `qnt_compras` to the `Fechamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `qnt_vendas` to the `Fechamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valor_pago` to the `Fechamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valor_recebido` to the `Fechamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valor_total_compras` to the `Fechamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valor_total_vendas` to the `Fechamento` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Banco" ALTER COLUMN "saldo" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."ContaFinanceira" ALTER COLUMN "valor" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."ConversaoEstoque" ALTER COLUMN "quantidade" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."Fechamento" DROP COLUMN "valor_conferido",
DROP COLUMN "valor_diferenca",
ADD COLUMN     "peso_total_compras" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "peso_total_vendas" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "qnt_compras" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "qnt_vendas" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "valor_pago" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "valor_recebido" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "valor_total_compras" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "valor_total_vendas" DECIMAL(10,2) NOT NULL,
ALTER COLUMN "valor_abertura" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "valor_abastecimentos" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "valor_despesas" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "valor_esperado" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."ItemPedido" ALTER COLUMN "preco" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "quantidade" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "tara" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "impureza" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "pesoBruto" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."LivroCaixa" ALTER COLUMN "saldoInicial" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "saldoFinal" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."Material" ALTER COLUMN "v_venda" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "estoque" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."MovimentacaoEstoque" ALTER COLUMN "quantidade" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."MovimentacaoFinanceira" ALTER COLUMN "valor" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "saldoFinal" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "saldoInicial" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."Pedido" ALTER COLUMN "valor_total" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."PrecoPorTabela" ALTER COLUMN "v_compra" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."SaldoFinanceiro" ALTER COLUMN "saldo" SET DATA TYPE DECIMAL(10,2);
