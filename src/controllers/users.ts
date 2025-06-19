import { Prisma } from "@prisma/client";

import { prisma } from "../libs/prisma";
import { PrismaClientKnownRequestError } from "../generated/prisma/runtime/library";

interface CreateUserArgs {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  cargo?: number;
}

export const createUser = async (data: CreateUserArgs) => {
  try {
    const user = await prisma.user.create({
      data: {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone || "",
        cargoID: data.cargo || 1,
        senha: data.senha,
      },
    });

    if (!user) {
      throw new Error("Erro durante o processamento dos dados");
    }
    return user;
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code == "P2002") {
        return {
          nome: "ErroProcessamento",
          mensagem: "Ja existe um usuário com esse ",
          acao: "Escolha outro email ou contate um administrador",
        };
      }
      if (error.code == "P2003") {
        return {
          nome: "ErroProcessamento",
          mensagem: "Cargo inexistente ",
          acao: "Escolha um cargo valido ou o cargo padrão",
        };
      }

      return error;
    }

    return error;
  }
};
