import { connect } from "http2";
import { BadRequest, InternalError, NotFound } from "../error";
import { Prisma } from "../generated/prisma";
import { prisma } from "../libs/prisma";

export const getAllRoles = async () => {
  try {
    const roles = await prisma.cargo.findMany({
      select: {
        id: true,
        nome: true,
      },
    });

    if (!roles) {
      throw new InternalError();
    }

    return roles;
  } catch (error) {
    throw error;
  }
};
export const getRoleByID = async (id: number) => {
  try {
    const role = await prisma.cargo.findFirst({
      where: { id },
      select: {
        id: true,
        nome: true,
        permissoes: true,
      },
    });

    return role;
  } catch (error) {
    throw error;
  }
};
type roleData = {
  nome: string;
  permissoes: number[];
};
export const addNewRole = async (x: roleData) => {
  try {
    const role = await prisma.cargo.upsert({
      where: {
        nome: x.nome,
      },
      update: {
        permissoes: {
          set: [],
          connect: x.permissoes.map((id) => ({ id })),
        },
      },
      create: {
        nome: x.nome,
        permissoes: x.permissoes
          ? { connect: x.permissoes.map((id) => ({ id })) }
          : undefined,
      },
      include: {
        permissoes: true,
      },
    });
    return role;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return new BadRequest("Já existe um cargo com o nome informado");
      }
      if (error.code === "P2025") {
        return new BadRequest(
          "Não conseguimos encontrar alguma permissão associada"
        );
      }
    }
    throw error;
  }
};
export const deleteRoleByID = async (id: number) => {
  try {
    const roleUsers = await prisma.cargo.findFirst({
      where: { id },
      select: {
        users: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!roleUsers) {
      throw new InternalError();
    }

    if (roleUsers?.users.length > 0) {
      throw new InternalError("Não foi possivel deletar esse registro.");
    }

    const role = await prisma.cargo.delete({ where: { id } });

    if (!role) {
      throw new InternalError();
    }

    return role;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return new BadRequest("Não conseguimos encontrar nenhum registro.");
      }
    }
    throw error;
  }
};
