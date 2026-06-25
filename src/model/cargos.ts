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
const findAll = async () => {
  try {
    return await prisma.cargo.findMany({
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
const cargo = {
  create,
  findAll,
  getByID,
  deleteUnique,
};

export default cargo;
