import { prisma } from "./libs/prisma";
import { addNewRole } from "./model/cargos";
import { createMaterial } from "./model/materiais";
import { createNewF } from "./model/registros";
import { createUser } from "./model/users";

export const popular = async () => {
  try {
    // cria cargo
    const cargo = await addNewRole({ nome: "Ola", permissoes: [] });
    // criar usuario
    const user = await createUser({
      email: "luiscdradm@gmail.com",
      senha: "1234",
      nome: "Luis Claudio",
    });
    // cria tabela
    const tabela = await prisma.tabela.create({ data: { nome: "Padrão" } });
    // cria categorias
    const CATmateriais = await prisma.categoriaMaterial.createMany({
      data: [
        { name: "PLASTICOS" },
        { name: "METAIS" },
        { name: "ELETRONICOS" },
      ],
    });
    // cria materiais
    const ListMateriais = [
      { nome: "PLASTICO MISTO", catID: 1, v_compra: 0.8, v_venda: 1.1 },
      { nome: "COBRE 1", catID: 2, v_compra: 35.5, v_venda: 45.5 },
      { nome: "PLACA", catID: 3, v_compra: 12, v_venda: 25.7 },
    ];
    const materiais = ListMateriais.forEach(async (element) => {
      await createMaterial(element);
    });
    //registro
    const registro = await createNewF({
      nome: "LUIS CLAUDIO DUARTE ROXO",
      cpf: "13575249784",
    });
    // movimentacoes do caixa TIPOS
    const Caixa_TipoMovimentacao =
      await prisma.caixa_TipoMovimentacao.createMany({
        data: [
          { nome: "ABERTURA", tipo: "ENTRADA" },
          { nome: "ABASTECIMENTO", tipo: "ENTRADA" },
          { nome: "VENDA", tipo: "ENTRADA" },
          { nome: "RECEBER", tipo: "ENTRADA" },
          { nome: "COMPRA", tipo: "SAIDA" },
          { nome: "EMPRESTAR", tipo: "SAIDA" },
          { nome: "DESPESA", tipo: "SAIDA" },
        ],
      });
    // CRIA PERMISSOES
    const permissoes = await prisma.permissoes.createMany({
      data: [
        { nome: "read:User" },
        { nome: "edit:User" },
        { nome: "create:User" },
        { nome: "delete:User" },
        { nome: "create:Role" },
        { nome: "asign:Permissions" },
        { nome: "edit:Role" },
        { nome: "delete:Role" },
        { nome: "read:Role" },
        { nome: "read:Transactions" },
        { nome: "create:Transactions" },
        { nome: "edit:Transactions" },
        { nome: "delete:Transactions" },
        { nome: "create:ClosureCash" },
        { nome: "edit:ClosureCash" },
        { nome: "read:Order" },
        { nome: "edit:Order" },
        { nome: "create:Order" },
        { nome: "delete:Order" },
        { nome: "edit:PriceOnOrder" },
        { nome: "read:Stock" },
        { nome: "create:StockMovement" },
        { nome: "create:StockConversion" },
        { nome: "delete:TotalStock" },
        { nome: "delete:ResetAllStock" },
        { nome: "create:Record" },
        { nome: "edit:Record" },
        { nome: "read:Record" },
        { nome: "delete:Record" },
        { nome: "create:Unidentified" },
        { nome: "create:Table" },
        { nome: "edit:Table" },
        { nome: "edit:PriceInTable" },
        { nome: "asign:Table" },
        { nome: "delete:Table" },
        { nome: "read:Table" },
        { nome: "create:Material" },
        { nome: "edit:Material" },
        { nome: "create:MaterialGroup" },
        { nome: "edit:MaterialGroup" },
        { nome: "delete:Material" },
        { nome: "delete:MaterialGroup" },
        { nome: "read:Material" },
        { nome: "read:MaterialGroup" },
      ],
    });
    // CRIA BANCO PADRAO

    const banco = await prisma.banco.create({
      data: { nome: "padrao", saldo: 0 },
    });
  } catch (error) {}
};

popular();
