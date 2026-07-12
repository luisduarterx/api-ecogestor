import { Prisma } from "../../generated/prisma/client";
import { BadRequest, NotFound, ValidationError } from "../error";
import { prisma } from "../libs/prisma";

interface CargoProps {
  nome: string;
  permissoes: number[];
}

const create = async (props: CargoProps) => {
  try {
    const existCargo = await prisma.cargo.findFirst({
      where: { nome: props.nome },
    });

    if (existCargo?.nome) {
      throw new BadRequest("Já existe um cargo com esse nome.");
    }

    const novoCargo = await prisma.cargo.create({
      data: {
        nome: props.nome.toUpperCase(),
        permissoes: {
          connect: props.permissoes.map((item) => ({ id: item })),
        },
      },
      include: {
        permissoes: true,
      },
    });

    return novoCargo;
  } catch (error) {
    throw error;
  }
};
const findAll = async (props: { filter?: string }) => {
  try {
    return await prisma.cargo.findMany({
      where: props.filter
        ? {
            nome: {
              contains: props.filter,
              mode: "insensitive",
            },
          }
        : {},
      include: {
        permissoes: true,
      },
    });
  } catch (error) {
    throw error;
  }
};
const getByID = async (props: { id: number }) => {
  try {
    const result = await prisma.cargo.findFirst({
      where: { id: props.id },
      include: { permissoes: true },
    });

    if (!result) {
      throw new NotFound();
    }

    return result;
  } catch (error) {
    throw error;
  }
};
const deleteUnique = async (props: { id: number }) => {
  try {
    const cargo = await prisma.cargo.findFirst({ where: { id: props.id } });

    if (!cargo) {
      throw new NotFound();
    }
    const usuarioUtilizandoCargo = await prisma.user.findFirst({
      where: { cargoID: props.id },
    });

    if (usuarioUtilizandoCargo?.nome) {
      throw new ValidationError(
        "Não é possível deletar um cargo que está sendo utilizado.",
      );
    }
    const cargoDeletado = await prisma.cargo.deleteMany({
      where: { id: props.id },
    });

    return { deletado: cargoDeletado.count };
  } catch (error) {
    throw error;
  }
};
const update = async (props: {
  id: number;
  data: { nome?: string; permissoes?: number[] };
}) => {
  try {
    const cargoExist = await prisma.cargo.findFirst({
      where: { id: props.id },
    });

    if (!cargoExist) {
      throw new NotFound();
    }

    if (props.data.nome) {
      const nomeUpper = props.data.nome.toUpperCase();

      const cargoWithSameName = await prisma.cargo.findFirst({
        where: {
          nome: nomeUpper,
          NOT: { id: props.id },
        },
      });

      if (cargoWithSameName) {
        throw new BadRequest("Já existe um cargo com esse nome.");
      }
    }

    const data: Prisma.CargoUpdateInput = {};

    if (props.data.nome) {
      data.nome = props.data.nome.toUpperCase();
    }

    if (props.data.permissoes) {
      data.permissoes = {
        set: props.data.permissoes.map((id) => ({ id })),
      };
    }

    const cargoAtualizado = await prisma.cargo.update({
      where: { id: props.id },
      data,
      include: { permissoes: true },
    });

    return cargoAtualizado;
  } catch (error) {
    throw error;
  }
};
const cargo = {
  create,
  findAll,
  getByID,
  deleteUnique,
  update,
};

export default cargo;
