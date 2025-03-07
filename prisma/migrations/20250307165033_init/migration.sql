-- CreateEnum
CREATE TYPE "TypeRegister" AS ENUM ('FISICA', 'JURIDICA');

-- CreateEnum
CREATE TYPE "TypeOrder" AS ENUM ('COMPRA', 'VENDA');

-- CreateEnum
CREATE TYPE "TypeStatus" AS ENUM ('ABERTO', 'FECHADO', 'PAGO');

-- CreateEnum
CREATE TYPE "TypeMovimentacao" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "CategoriaMovimentacao" AS ENUM ('PEDIDO', 'ABASTECIMENTO', 'RETIRADA', 'DESPESA');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "rankID" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rank" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Rank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Register" (
    "id" SERIAL NOT NULL,
    "nome_razao" TEXT NOT NULL,
    "cpf_cnpj" TEXT NOT NULL,
    "ie" TEXT,
    "apelido" TEXT NOT NULL,
    "tipo" "TypeRegister" NOT NULL DEFAULT 'FISICA',
    "tabelaID" INTEGER NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Register_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaldoFinanceiro" (
    "id" SERIAL NOT NULL,
    "registerID" INTEGER NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "SaldoFinanceiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Endereco" (
    "id" SERIAL NOT NULL,
    "registerID" INTEGER NOT NULL,
    "estado" TEXT,
    "cidade" TEXT,
    "bairro" TEXT NOT NULL,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "complemento" TEXT,

    CONSTRAINT "Endereco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentData" (
    "id" SERIAL NOT NULL,
    "banco" TEXT NOT NULL,
    "agencia" INTEGER NOT NULL,
    "conta" INTEGER NOT NULL,
    "chave" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "registerID" INTEGER NOT NULL,

    CONSTRAINT "PaymentData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tabela" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Tabela_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TabelasMateriais" (
    "id" SERIAL NOT NULL,
    "v_compra" DECIMAL(65,30) NOT NULL,
    "materialID" INTEGER NOT NULL,
    "tabelaID" INTEGER NOT NULL,

    CONSTRAINT "TabelasMateriais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "groupID" INTEGER NOT NULL,
    "v_compra" DECIMAL(65,30) NOT NULL,
    "v_venda" DECIMAL(65,30) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estoque" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaMaterial" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "CategoriaMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" SERIAL NOT NULL,
    "registerID" INTEGER NOT NULL,
    "tipo" "TypeOrder" NOT NULL,
    "totalValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "TypeStatus" NOT NULL,
    "userID" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPedido" (
    "id" SERIAL NOT NULL,
    "pedidoID" INTEGER NOT NULL,
    "materialID" INTEGER NOT NULL,
    "preco" DECIMAL(65,30) NOT NULL,
    "quantidade" DECIMAL(65,30) NOT NULL,
    "tara" DECIMAL(65,30) NOT NULL,
    "impureza" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "ItemPedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Caixa" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Caixa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movimentacao" (
    "id" SERIAL NOT NULL,
    "tipo" "TypeMovimentacao" NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoria" "CategoriaMovimentacao" NOT NULL,
    "descricao" TEXT,
    "value" DECIMAL(65,30) NOT NULL,
    "caixaID" INTEGER NOT NULL,
    "pedidoID" INTEGER,
    "parcela" INTEGER,
    "totalParcelas" INTEGER,
    "userID" INTEGER NOT NULL,

    CONSTRAINT "Movimentacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SaldoFinanceiro_registerID_key" ON "SaldoFinanceiro"("registerID");

-- CreateIndex
CREATE UNIQUE INDEX "Endereco_registerID_key" ON "Endereco"("registerID");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentData_registerID_key" ON "PaymentData"("registerID");

-- CreateIndex
CREATE UNIQUE INDEX "Tabela_nome_key" ON "Tabela"("nome");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_rankID_fkey" FOREIGN KEY ("rankID") REFERENCES "Rank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Register" ADD CONSTRAINT "Register_tabelaID_fkey" FOREIGN KEY ("tabelaID") REFERENCES "Tabela"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaldoFinanceiro" ADD CONSTRAINT "SaldoFinanceiro_registerID_fkey" FOREIGN KEY ("registerID") REFERENCES "Register"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endereco" ADD CONSTRAINT "Endereco_registerID_fkey" FOREIGN KEY ("registerID") REFERENCES "Register"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentData" ADD CONSTRAINT "PaymentData_registerID_fkey" FOREIGN KEY ("registerID") REFERENCES "Register"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TabelasMateriais" ADD CONSTRAINT "TabelasMateriais_materialID_fkey" FOREIGN KEY ("materialID") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TabelasMateriais" ADD CONSTRAINT "TabelasMateriais_tabelaID_fkey" FOREIGN KEY ("tabelaID") REFERENCES "Tabela"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_groupID_fkey" FOREIGN KEY ("groupID") REFERENCES "CategoriaMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_registerID_fkey" FOREIGN KEY ("registerID") REFERENCES "Register"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_pedidoID_fkey" FOREIGN KEY ("pedidoID") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_materialID_fkey" FOREIGN KEY ("materialID") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimentacao" ADD CONSTRAINT "Movimentacao_caixaID_fkey" FOREIGN KEY ("caixaID") REFERENCES "Caixa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimentacao" ADD CONSTRAINT "Movimentacao_pedidoID_fkey" FOREIGN KEY ("pedidoID") REFERENCES "Pedido"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimentacao" ADD CONSTRAINT "Movimentacao_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
