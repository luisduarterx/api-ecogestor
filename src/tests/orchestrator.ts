import { prisma } from "../libs/prisma";

import { encriptarSenha } from "../services/password";
import { faker } from "@faker-js/faker";

import { gerarToken } from "../services/jwt";
import cargo from "../model/cargos";
import material from "../model/materiais";
import registro from "../model/registros";
import { RegistroCreateInput } from "../types/registros";

export async function clearDatabase() {
  await prisma.user.deleteMany();
  await prisma.permissoes.deleteMany();
  await prisma.cargo.deleteMany();
  await prisma.dadosPagamento.deleteMany();
  await prisma.endereco.deleteMany();
  await prisma.saldoFinanceiro.deleteMany();
  await prisma.pessoaFisica.deleteMany();
  await prisma.pessoaJuridica.deleteMany();
  await prisma.registro.deleteMany();
  await prisma.precoPorTabela.deleteMany();
  await prisma.tabela.deleteMany();
  await prisma.material.deleteMany();
  await prisma.categoriaMaterial.deleteMany();

  // Apaga os dados e reinicia o contador do ID automático
}

const createUserWithoutPermission = async (Props: {
  nome?: string;
  email?: string;
  senha?: string;
}) => {
  const cargo = await prisma.cargo.create({
    data: {
      nome: faker.internet.displayName().toUpperCase(),
    },
  });

  const senha = await encriptarSenha(Props.senha || "senha");
  const user = await prisma.user.create({
    data: {
      nome: Props.nome?.toUpperCase() || faker.person.firstName().toUpperCase(),
      email:
        Props.email?.toLocaleLowerCase() ||
        faker.internet.email().toLowerCase(),
      senha: senha,
      cargoID: cargo.id,
    },
  });
  const jwt = gerarToken({
    id: user.id,
    nome: user.nome,
    email: user.email,
    cargo: user.cargoID,
  });

  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    cargo: user.cargoID,
    jwt,
  };
};
const findPermissions = async () => {
  return await prisma.permissoes.findMany({});
};
const userAuthenticated = async (Props: {
  nome?: string;
  email?: string;
  senha?: string;
}) => {
  await prisma.permissoes.createManyAndReturn({
    data: [
      { nome: "create:cargo" },
      { nome: "read:cargo" },
      { nome: "read:cargos" },
      { nome: "update:cargo" },
      { nome: "delete:cargo" },
      { nome: "read:usuario" },
      { nome: "read:usuarios" },
      { nome: "create:usuario" },
      { nome: "delete:usuario" },
      { nome: "update:usuario" },
      { nome: "read:categoria_materiais" },
      { nome: "read:categorias_materiais" },
      { nome: "create:categoria_materiais" },
      { nome: "delete:categoria_materiais" },
      { nome: "update:categoria_materiais" },
      { nome: "create:material" },
      { nome: "read:material" },
      { nome: "update:material" },
      { nome: "delete:material" },
      { nome: "read:materiais" },
      { nome: "read:registro" },
      { nome: "read:registros" },
      { nome: "create:registros" },
      { nome: "update:registros" },
      { nome: "delete:registros" },
    ],
    skipDuplicates: true, // Evita erros se rodar o teste localmente pela segunda vez
  });
  const permissoes = await prisma.permissoes.findMany();
  const mapPermissions = permissoes.map((item) => ({ id: item.id }));

  const cargoAdmin = await prisma.cargo.create({
    data: {
      nome: "ADMIN",
      permissoes: {
        connect: mapPermissions,
      },
    },
    include: {
      permissoes: true,
    },
  });

  const senha = await encriptarSenha(Props.senha || "senha");
  const user = await prisma.user.create({
    data: {
      nome: Props.nome || faker.person.firstName(),
      email: Props.email || faker.internet.email(),
      senha,
      cargoID: cargoAdmin.id,
    },
  });

  const jwt = gerarToken({
    id: user.id,
    nome: user.nome,
    email: user.email,
    cargo: user.cargoID,
  });

  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    cargo: user.cargoID,
    jwt,
  };
};
const createCargo = async (Props: { nome: string; permissoes: number[] }) => {
  return await cargo.create(Props);
};

const createCatMaterial = async (Props: { nome: string }) => {
  return await prisma.categoriaMaterial.create({ data: { nome: Props.nome } });
};
const createDefaultTable = async () => {
  return await prisma.tabela.create({
    data: {
      nome: "PADRAO",
    },
  });
};
const createMaterial = async (Props: { nome: string; catID: number }) => {
  return await material.create({
    nome: Props.nome,
    catID: Props.catID,
    preco_compra: 1,
    preco_venda: 2,
  });
};
const createRegistro = async (Props: RegistroCreateInput) => {
  return await registro.create(Props);
};
const orchestrator = {
  clearDatabase,
  createCargo,
  createUserWithoutPermission,
  userAuthenticated,
  findPermissions,
  createCatMaterial,
  createDefaultTable,
  createMaterial,
  createRegistro,
};

export default orchestrator;
