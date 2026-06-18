import type { User } from "../../generated/prisma/client";
import { popular } from "../inicial";
import { prisma } from "../libs/prisma";
import { Prisma } from "../../generated/prisma/client";
import { encriptarSenha } from "../services/password";

export async function clearDatabase() {
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename != '_prisma_migrations'
  `;

  const tables = tablenames.map(({ tablename }) => `"${tablename}"`).join(", ");

  if (tables.length === 0) return;

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`,
  );
}

const seedDatabase = async () => {
  return await popular();
};
const createUser = async (Props: Prisma.UserCreateInput) => {
  const senha = await encriptarSenha(Props.senha);
  return await prisma.user.create({
    data: {
      nome: Props.nome,
      email: Props.email,
      senha: senha,
    },
  });
};

const orchestrator = {
  clearDatabase,
  seedDatabase,
  createUser,
};

export default orchestrator;
