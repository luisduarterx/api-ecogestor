-- Preserva pedidos cancelados sem remover seu histórico.
ALTER TYPE "TipoStatusPedido" ADD VALUE IF NOT EXISTS 'CANCELADO';

-- Rastreabilidade direta entre pedido e movimentos de estoque.
ALTER TABLE "MovimentacaoEstoque"
ADD COLUMN "pedidoID" INTEGER;

ALTER TABLE "MovimentacaoEstoque"
ADD CONSTRAINT "MovimentacaoEstoque_pedidoID_fkey"
FOREIGN KEY ("pedidoID") REFERENCES "Pedido"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "MovimentacaoEstoque_pedidoID_idx"
ON "MovimentacaoEstoque"("pedidoID");

-- Todo lançamento originado por pedido registra o caixa operacional do pedido.
-- O campo permanece opcional para lançamentos financeiros avulsos.
ALTER TABLE "LancamentoFinanceiro"
ADD COLUMN "caixa_id" INTEGER;

ALTER TABLE "LancamentoFinanceiro"
ADD CONSTRAINT "LancamentoFinanceiro_caixa_id_fkey"
FOREIGN KEY ("caixa_id") REFERENCES "Caixa"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "LancamentoFinanceiro_caixa_id_idx"
ON "LancamentoFinanceiro"("caixa_id");
