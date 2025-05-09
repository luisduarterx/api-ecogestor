-- CreateEnum
CREATE TYPE "TipoRegistro" AS ENUM ('FISICA', 'JURIDICA');

-- CreateEnum
CREATE TYPE "TipoPedido" AS ENUM ('COMPRA', 'VENDA');

-- CreateEnum
CREATE TYPE "TipoStatusPedido" AS ENUM ('ABERTO', 'FECHADO', 'PAGO');

-- CreateEnum
CREATE TYPE "TipoMovimentacao" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('DINHEIRO', 'PIX', 'TRANSFERENCIA', 'ABATER');

-- CreateEnum
CREATE TYPE "CategoriaMovimentacao" AS ENUM ('PEDIDO', 'ABASTECIMENTO', 'RETIRADA', 'DESPESA');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "cargoID" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permissoes" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "Permissoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cargo" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Cargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registro" (
    "id" SERIAL NOT NULL,
    "nome_razao" TEXT NOT NULL,
    "apelido" TEXT,
    "tipo" "TipoRegistro" NOT NULL,
    "tabelaID" INTEGER NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Registro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PessoaFisica" (
    "id" INTEGER NOT NULL,
    "cpf" TEXT NOT NULL,
    "nascimento" TIMESTAMP(3),

    CONSTRAINT "PessoaFisica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PessoaJuridica" (
    "id" INTEGER NOT NULL,
    "cnpj" TEXT NOT NULL,
    "ie" TEXT,
    "fantasia" TEXT,

    CONSTRAINT "PessoaJuridica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaldoFinanceiro" (
    "id" SERIAL NOT NULL,
    "regID" INTEGER NOT NULL,
    "saldo" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "SaldoFinanceiro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Endereco" (
    "id" SERIAL NOT NULL,
    "regID" INTEGER NOT NULL,
    "estado" TEXT,
    "cidade" TEXT,
    "bairro" TEXT,
    "logradouro" TEXT,
    "numero" TEXT,
    "complemento" TEXT,

    CONSTRAINT "Endereco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DadosPagamento" (
    "id" SERIAL NOT NULL,
    "banco" TEXT,
    "agencia" INTEGER,
    "conta" INTEGER,
    "chave" TEXT,
    "cpf" TEXT,
    "regID" INTEGER NOT NULL,

    CONSTRAINT "DadosPagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tabela" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tabela_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrecoPorTabela" (
    "id" SERIAL NOT NULL,
    "v_compra" DECIMAL(65,30) NOT NULL,
    "materialID" INTEGER NOT NULL,
    "tabelaID" INTEGER NOT NULL,
    "editadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrecoPorTabela_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "catID" INTEGER NOT NULL,
    "v_venda" DECIMAL(65,30) NOT NULL,
    "estoque" DECIMAL(65,30) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaMaterial" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "CategoriaMaterial_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Pedido" (
    "id" SERIAL NOT NULL,
    "regID" INTEGER NOT NULL,
    "tipo" "TipoPedido" NOT NULL,
    "valor_total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "TipoStatusPedido" NOT NULL,
    "userID" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" SERIAL NOT NULL,
    "pedidoID" INTEGER NOT NULL,
    "contaID" INTEGER NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "forma" "FormaPagamento" NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoria" "CategoriaMovimentacao" NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "Pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conta" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "saldo" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Conta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimentacaoFinanceira" (
    "id" SERIAL NOT NULL,
    "contaID" INTEGER NOT NULL,
    "tipoMovimentacao" "TipoMovimentacao" NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "descricao" TEXT,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoria" "CategoriaMovimentacao" NOT NULL,
    "origemId" INTEGER,

    CONSTRAINT "MovimentacaoFinanceira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserPermissions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserPermissions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Permissoes_nome_key" ON "Permissoes"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Cargo_nome_key" ON "Cargo"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "PessoaFisica_cpf_key" ON "PessoaFisica"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "PessoaJuridica_cnpj_key" ON "PessoaJuridica"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "SaldoFinanceiro_regID_key" ON "SaldoFinanceiro"("regID");

-- CreateIndex
CREATE UNIQUE INDEX "Endereco_regID_key" ON "Endereco"("regID");

-- CreateIndex
CREATE UNIQUE INDEX "DadosPagamento_regID_key" ON "DadosPagamento"("regID");

-- CreateIndex
CREATE UNIQUE INDEX "Tabela_nome_key" ON "Tabela"("nome");

-- CreateIndex
CREATE INDEX "_UserPermissions_B_index" ON "_UserPermissions"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_cargoID_fkey" FOREIGN KEY ("cargoID") REFERENCES "Cargo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registro" ADD CONSTRAINT "Registro_tabelaID_fkey" FOREIGN KEY ("tabelaID") REFERENCES "Tabela"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PessoaFisica" ADD CONSTRAINT "PessoaFisica_id_fkey" FOREIGN KEY ("id") REFERENCES "Registro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PessoaJuridica" ADD CONSTRAINT "PessoaJuridica_id_fkey" FOREIGN KEY ("id") REFERENCES "Registro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaldoFinanceiro" ADD CONSTRAINT "SaldoFinanceiro_regID_fkey" FOREIGN KEY ("regID") REFERENCES "Registro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endereco" ADD CONSTRAINT "Endereco_regID_fkey" FOREIGN KEY ("regID") REFERENCES "Registro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DadosPagamento" ADD CONSTRAINT "DadosPagamento_regID_fkey" FOREIGN KEY ("regID") REFERENCES "Registro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrecoPorTabela" ADD CONSTRAINT "PrecoPorTabela_materialID_fkey" FOREIGN KEY ("materialID") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrecoPorTabela" ADD CONSTRAINT "PrecoPorTabela_tabelaID_fkey" FOREIGN KEY ("tabelaID") REFERENCES "Tabela"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_catID_fkey" FOREIGN KEY ("catID") REFERENCES "CategoriaMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_pedidoID_fkey" FOREIGN KEY ("pedidoID") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_materialID_fkey" FOREIGN KEY ("materialID") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_regID_fkey" FOREIGN KEY ("regID") REFERENCES "Registro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_pedidoID_fkey" FOREIGN KEY ("pedidoID") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_contaID_fkey" FOREIGN KEY ("contaID") REFERENCES "Conta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoFinanceira" ADD CONSTRAINT "MovimentacaoFinanceira_contaID_fkey" FOREIGN KEY ("contaID") REFERENCES "Conta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserPermissions" ADD CONSTRAINT "_UserPermissions_A_fkey" FOREIGN KEY ("A") REFERENCES "Permissoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserPermissions" ADD CONSTRAINT "_UserPermissions_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
