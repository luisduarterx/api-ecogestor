import type { User } from "../../generated/prisma/client";
import { popular } from "../inicial";
import { prisma } from "../libs/prisma";
import { Prisma } from "../../generated/prisma/client";
import { encriptarSenha } from "../services/password";
import { faker } from "@faker-js/faker";
import * as DBUser from "../model/users";
import { gerarToken } from "../services/jwt";

export async function clearDatabase() {
  await prisma.user.deleteMany();
}

const seedDatabase = async () => {
  await prisma.cargo.upsert({
    where: { nome: "ADMIN", id: 1 },
    update: {},
    create: { nome: "ADMIN" },
  });
};
const createUser = async (Props: {
  nome?: string;
  email?: string;
  senha?: string;
}) => {
  const senha = await encriptarSenha(Props.senha || "senha");
  return await prisma.user.create({
    data: {
      nome: Props.nome || faker.person.firstName(),
      email: Props.email || faker.internet.email(),
      senha: senha,
      cargoID: 1,
    },
  });
};
const userAuthenticated = async (Props: {
  nome?: string;
  email?: string;
  senha?: string;
}) => {
  const senha = await encriptarSenha(Props.senha || "senha");
  const user = await prisma.user.create({
    data: {
      nome: Props.nome || faker.person.firstName(),
      email: Props.email || faker.internet.email(),
      senha: senha,
      cargoID: 1,
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

const orchestrator = {
  clearDatabase,
  seedDatabase,
  createUser,
  userAuthenticated,
};

export default orchestrator;
