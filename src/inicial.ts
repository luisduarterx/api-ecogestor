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
  } catch (error) {}
};

popular();
