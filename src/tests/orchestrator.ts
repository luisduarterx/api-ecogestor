import { prisma } from "../libs/prisma";

import { encriptarSenha } from "../services/password";
import { faker } from "@faker-js/faker";

import { gerarToken } from "../services/jwt";
import cargo from "../model/cargo";
import material from "../model/material";
import registro from "../model/registro";
import { RegistroCreateInput } from "../types/registros";
import tabela, { TableInput } from "../model/tabela";
import contaFinanceira from "../model/contaFinanceira";
import transferenciaFinanceira, {
  EstornoTransferenciaInput,
  TransferenciaInput,
} from "../model/transferencia";

export async function clearDatabase() {
  await prisma.movimentacaoFinanceira.deleteMany();
  await prisma.transferenciaFinanceira.deleteMany();
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
  await prisma.contaFinanceira.deleteMany();

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
      { nome: "read:conta" },
      { nome: "read:contas" },
      { nome: "create:conta" },
      { nome: "update:conta" },
      { nome: "delete:conta" },
      { nome: "read:tabela" },
      { nome: "read:tabelas" },
      { nome: "create:tabelas" },
      { nome: "update:tabelas" },
      { nome: "delete:tabelas" },
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
      padrao: true,
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
const createConta = async (Props: {
  status?: boolean;
  conta_padrao: boolean;
  nome: string;
  saldo_inicial: number;
}) => {
  return await contaFinanceira.create({
    nome: Props.nome,
    saldo_inicial: Props.saldo_inicial,
    conta_padrao: Props.conta_padrao,
    status: Props.status || undefined,
  });
};

const createTabela = async (Props: TableInput) => {
  return await tabela.create({
    nome: Props.nome,
    padrao: Props.padrao,
    materiais: Props.materiais,
  });
};
const createTransferencia = async (props: TransferenciaInput) => {
  return await transferenciaFinanceira.create(props);
};
const createEstorno = async (props: EstornoTransferenciaInput) => {
  return await transferenciaFinanceira.reverse(props);
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
  createConta,
  createTabela,
  createTransferencia,
  createEstorno,
};

export default orchestrator;
