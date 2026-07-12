import { BadRequest, NotFound, NotPossible, ValidationError } from "../error";
import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../libs/prisma";

type UpsertTypeCategory = {
  id?: number;
  nome: string;
};
const create = async (props: { nome: string }) => {
  try {
    const catExist = await prisma.categoriaMaterial.findFirst({
      where: {
        nome: props.nome,
      },
    });

    if (catExist?.nome) {
      throw new ValidationError(
        "Já existe uma categoria com esse nome cadastrado.",
      );
    }

    const newCat = await prisma.categoriaMaterial.create({
      data: {
        nome: props.nome,
      },
    });
    return newCat;
  } catch (error) {
    throw error;
  }
};
const update = async ({ id, nome }: UpsertTypeCategory) => {
  try {
    const catExist = await prisma.categoriaMaterial.findFirst({
      where: { id },
    });

    const nomeExist = await prisma.categoriaMaterial.findFirst({
      where: {
        nome,
        NOT: {
          id,
        },
      },
    });
    if (nomeExist?.nome) {
      throw new ValidationError(
        "O nome dessa categoria já esta sendo utilizada.",
      );
    }

    if (!catExist?.id) {
      throw new NotFound();
    }
    const novaCat = await prisma.categoriaMaterial.update({
      where: { id },
      data: {
        nome,
      },
    });
    return novaCat;
  } catch (error) {
    throw error;
  }
};
const deleteUnique = async (id: number) => {
  try {
    const catExist = await prisma.categoriaMaterial.findFirst({
      where: { id },
      include: { materiais: true },
    });

    if (!catExist?.id) {
      throw new NotFound();
    }

    if (catExist.materiais.length > 0) {
      throw new ValidationError(
        "Não é possivel deletar uma categoria com materiais associados.",
      );
    }

    const deletar = await prisma.categoriaMaterial.delete({
      where: { id },
    });

    return {
      id: deletar.id,
      count: 1,
    };
  } catch (error) {
    throw error;
  }
};
const findAll = async (props: { filter?: string }) => {
  try {
    const categorias = await prisma.categoriaMaterial.findMany({
      where: {
        OR: props.filter
          ? [{ nome: { contains: props.filter, mode: "insensitive" } }]
          : undefined,
      },
    });

    return categorias;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
const getByID = async (id: number) => {
  try {
    const categoria = await prisma.categoriaMaterial.findFirst({
      where: { id },
    });

    if (!categoria?.nome) {
      throw new NotFound();
    }

    return categoria;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const categoria = {
  create,
  update,
  deleteUnique,
  findAll,
  getByID,
};

export default categoria;
