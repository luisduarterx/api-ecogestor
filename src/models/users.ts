import { Prisma, User } from "@prisma/client";
import { prisma } from "infra/prisma";
import { hashPassword } from "./password";
import { error } from "console";
export type CreateUserResponse = User | { error: boolean; message: string };
type ErrorResponse = {
  error: boolean;
  message: string;
};
type CreateUserData = {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  rankID?: number;
};
export async function createUser(data: CreateUserData) {
  try {
    data.senha = await hashPassword(data.senha);

    const user = await prisma.user.create({
      data: {
        name: data.nome,
        email: data.email.toLowerCase(),
        senha: data.senha,
        telefone: data.telefone || "",
        rankID: data.rankID || 1,
      },
    });
    return user;
  } catch (error) {
    console.log(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      let message: string;
      switch (error.code) {
        case "P2002":
          message = "Ja existe um usuario com esse email";
          break;

        case "P2003":
          message = "Associaçao inexistente";
          break;
        default:
          message = "Erro desconhecido no banco de dados";
      }
      return { error: true, message };
    }
    return { error: true, message: "erro desconhecidos" };
  }
}
export async function findUserByEmail(email: string) {
  try {
    const user: User | null = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      return { error: true, message: "usuario nao encontrado" };
    }
    return user;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { error: true, message: error.message };
    }
    return {
      error: true,
      message: "Erro desconhecido ao consultar banco de dados.",
    };
  }
}
export async function findUserById(id: number) {
  try {
    const user: User | null = await prisma.user.findFirst({ where: { id } });
    if (!user) {
      return { error: true, message: "usuario nao encontrado" };
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      telefone: user.telefone,
      rankID: user.rankID,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return { error: true, message: error.message };
    }
    return {
      error: true,
      message: "Erro desconhecido ao consultar banco de dados.",
    };
  }
}
