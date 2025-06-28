import { prisma } from "../libs/prisma";
import { PrismaClientKnownRequestError } from "../generated/prisma/runtime/library";
import { UserNotFound } from "../error";
import { encriptarSenha } from "../services/password";
import bcrypt from "bcrypt";

interface CreateUserArgs {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  cargo?: number;
}
interface UserDataAcess {
  email: string;
  senha: string;
}

export const createUser = async (data: CreateUserArgs) => {
  try {
    const user = await prisma.user.create({
      data: {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone || "",
        cargoID: data.cargo || 1,
        senha: await encriptarSenha(data.senha),
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
          mensagem: "Ja existe um usuário com esse email",
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
export const findUserByEmail = async (email: string) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (!user) {
      throw new UserNotFound();
    }

    return user;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const validateUser = async (data: UserDataAcess) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user) {
    throw new UserNotFound();
  }

  const passwordCorrect = await bcrypt.compare(data.senha, user.senha);

  if (!passwordCorrect) {
    throw new UserNotFound();
  }

  const dataUser = {
    id: user.id,
    nome: user.nome,
    email: user.email,
    telefone: user.telefone,
    cargo: user.cargoID,
  };

  return dataUser;
};
