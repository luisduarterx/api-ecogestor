import { prisma } from "../libs/prisma";

import {
  BadRequest,
  InternalError,
  UnAuthorized,
  UserNotFound,
} from "../error";
import { encriptarSenha } from "../services/password";
import bcrypt from "bcrypt";
import { error } from "console";
import { Prisma } from "../generated/prisma";
import { CreateUserArgs, UserDataAcess, UserDataEdit } from "../types/user";

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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
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

      throw error;
    }

    throw error;
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
    throw error;
  }
};

export const validateUser = async (data: UserDataAcess) => {
  const user = await prisma.user.findFirst({
    where: { AND: { email: data.email, deletedAt: null } },
  });

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

export const getAllUsers = async () => {
  try {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
      },

      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        cargoID: true,
      },
    });

    return users;
  } catch (error) {
    throw error;
  }
};
export const deleteUserByID = async (id: number) => {
  try {
    const user = prisma.user.update({
      where: { id: id, deletedAt: null },
      data: {
        deletedAt: new Date(),
      },
    });

    return user;
  } catch (error) {
    throw error;
  }
};
export const getUserByID = async (id: number) => {
  try {
    const user = await prisma.user.findFirst({
      where: { AND: { id: id, deletedAt: null } },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        cargoID: true,
      },
    });

    return user;
  } catch (error) {
    console.log(error);
    return null;
  }
};
export const editUserData = async (data: UserDataEdit) => {
  try {
    console.log(data);
    const user = await prisma.user.update({
      where: { id: data.id },
      data: {
        email: data.email,
        cargoID: data.cargoID,
        telefone: data.telefone,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        cargoID: true,
      },
    });

    if (!user) {
      return null;
    }

    return user;
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        throw new BadRequest("Cargo inexistente. Escolha um cargo válido.");
      }

      if (error.code === "P2002") {
        throw new BadRequest("Email já cadastrado.");
      }
    }

    console.error("Erro inesperado:", error);
    throw new InternalError("Erro inesperado no servidor.");
  }
};
export const userHasPermission = async (userID: number, permission: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userID },
      select: {
        cargo: {
          select: {
            id: true,
            nome: true,
            permissoes: { select: { nome: true } },
          },
        },
      },
    });
    if (!user?.cargo) {
      throw new UnAuthorized();
    }

    return user.cargo.permissoes.some((p) => p.nome === permission);
  } catch (error) {}
};
