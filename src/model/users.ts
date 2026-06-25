import { prisma } from "../libs/prisma";
import dotenv from "dotenv";
dotenv.config();
import {
  BadRequest,
  BaseError,
  InternalError,
  NotFound,
  UnAuthorized,
  UserNotFound,
  ValidationError,
} from "../error";
import { encriptarSenha } from "../services/password";
import bcrypt from "bcrypt";
import { error } from "console";
import { Cargo, Prisma, User } from "../../generated/prisma/client";
import { CreateUserArgs, UserDataAcess, UserDataEdit } from "../types/user";
interface userReturn {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  cargoID: number;
  permissoes: String[];
}

const create = async (props: CreateUserArgs) => {
  try {
    if (!process.env.USER_DEFAULT_PASSWORD) {
      throw new InternalError("Senha padrão não está configurada.");
    }
    const userExist = await prisma.user.findFirst({
      where: { email: props.email },
    });

    if (userExist?.nome) {
      throw new ValidationError();
    }

    const senhaPadrao = await encriptarSenha(
      process.env.USER_DEFAULT_PASSWORD as string,
    );

    const novoUsuario = await prisma.user.create({
      data: {
        nome: props.nome.toLocaleUpperCase(),
        email: props.email.toLowerCase(),
        cargoID: props.cargoID,
        senha: senhaPadrao,
      },

      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,

        cargo: true,
      },
    });

    return novoUsuario;
  } catch (error) {
    throw error;
  }
};
const findUserByEmail = async (email: string) => {
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

const validateUser = async (data: UserDataAcess) => {
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
    cargo: user.cargoID,
  };

  return dataUser;
};

const findAll = async (
  props: {
    nome?: string;
    email?: string;
    cargoID?: number;
    cargoNome?: string;
    filter?: string;
  } = {},
) => {
  try {
    const conditions: Prisma.UserWhereInput[] = [{ deletedAt: null }];

    if (props.nome) {
      conditions.push({
        nome: {
          contains: props.nome,
          mode: "insensitive",
        },
      });
    }

    if (props.email) {
      conditions.push({
        email: {
          contains: props.email,
          mode: "insensitive",
        },
      });
    }

    if (props.cargoID) {
      conditions.push({
        cargoID: props.cargoID,
      });
    }

    if (props.cargoNome) {
      conditions.push({
        cargo: {
          nome: {
            contains: props.cargoNome,
            mode: "insensitive",
          },
        },
      });
    }

    if (props.filter) {
      conditions.push({
        OR: [
          {
            nome: {
              contains: props.filter,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: props.filter,
              mode: "insensitive",
            },
          },
          {
            cargo: {
              nome: {
                contains: props.filter,
                mode: "insensitive",
              },
            },
          },
        ],
      });
    }

    const users = await prisma.user.findMany({
      where: conditions.length > 1 ? { AND: conditions } : conditions[0],
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
const deleteUnique = async (id: number) => {
  try {
    const userExist = await prisma.user.findFirst({ where: { id } });

    if (!userExist?.nome) {
      throw new NotFound();
    }

    const user = await prisma.user.update({
      where: { id: id, deletedAt: null },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      id: user.id,
      deletedAt: user.deletedAt,
    };
  } catch (error) {
    throw error;
  }
};
const getUserByID = async (id: number) => {
  try {
    const user = await prisma.user.findFirst({
      where: { AND: { id: id, deletedAt: null } },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        cargo: true,
      },
    });

    return user;
  } catch (error) {
    throw error;
  }
};
const update = async ({ id, data }: UserDataEdit) => {
  try {
    const userExist = await prisma.user.findFirst({
      where: {
        id,
        AND: {
          deletedAt: null,
        },
      },
    });

    if (!userExist?.nome) {
      throw new NotFound();
    }
    if (data.email) {
      const emailExist = await prisma.user.findFirst({
        where: { email: data.email, NOT: { id } },
      });

      if (emailExist?.nome) {
        throw new ValidationError(
          "Esse email já está sendo utilizado por outro usuário.",
        );
      }
    }
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        cargo: true,
      },
    });

    return user;
  } catch (error: any) {
    throw error;
  }
};
const userHasPermission = async (userID: number, permission: string) => {
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

const user = {
  create,
  findUserByEmail,
  validateUser,
  findAll,
  deleteUnique,
  getUserByID,
  update,
  userHasPermission,
};

export default user;
