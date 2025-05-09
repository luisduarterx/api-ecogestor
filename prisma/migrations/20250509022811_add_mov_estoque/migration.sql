-- CreateEnum
CREATE TYPE "TipoMovimentacaoEstoque" AS ENUM ('VENDA', 'COMPRA', 'ENTRADA_MANUAL', 'SAIDA_MANUAL', 'ENTRADA_CONVERSAO', 'SAIDA_CONVERSAO');

-- CreateEnum
CREATE TYPE "OrigemMovimentacaoEstoque" AS ENUM ('PEDIDO', 'AJUSTE', 'CONVERSAO');

-- CreateTable
CREATE TABLE "MovimentacaoEstoque" (
    "id" SERIAL NOT NULL,
    "materialID" INTEGER NOT NULL,
    "tipo" "TipoMovimentacaoEstoque" NOT NULL,
    "quantidade" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "origemID" INTEGER,
    "origemTipo" "OrigemMovimentacaoEstoque" NOT NULL,
    "conversaoEstoqueId" INTEGER,

    CONSTRAINT "MovimentacaoEstoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversaoEstoque" (
    "id" SERIAL NOT NULL,
    "mat_origemID" INTEGER NOT NULL,
    "mat_destinoID" INTEGER NOT NULL,
    "quantidade" DECIMAL(65,30) NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversaoEstoque_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MovimentacaoEstoque" ADD CONSTRAINT "MovimentacaoEstoque_materialID_fkey" FOREIGN KEY ("materialID") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoEstoque" ADD CONSTRAINT "MovimentacaoEstoque_conversaoEstoqueId_fkey" FOREIGN KEY ("conversaoEstoqueId") REFERENCES "ConversaoEstoque"("id") ON DELETE SET NULL ON UPDATE CASCADE;
