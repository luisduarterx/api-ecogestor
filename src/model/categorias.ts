import { BadRequest, NotPossible } from "../error";
import { Prisma } from "../generated/prisma";
import { prisma } from "../libs/prisma";

type UpsertTypeCategory = {
  id?: number;
  nome: string;
};
export const createCategory = async ({ id, nome }: UpsertTypeCategory) => {
  try {
    if (id) {
      const categoria = await prisma.categoriaMaterial.update({
        where: { id },

        data: {
          name: nome,
        },
      });

      return categoria;
    } else {
      const categoria = await prisma.categoriaMaterial.create({
        data: { name: nome },
      });
      return categoria;
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code == "P2002") {
        throw new NotPossible(
          "Não é possível criar uma categoria já existente!"
        );
      }
      if (error.code == "P2025") {
        throw new BadRequest(
          "O id enviado não pertence a nenhum registro existente."
        );
      }
    }
    console.log(error);
    throw error;
  }
};
export const deleteCategory = async (id: number) => {
  try {
    const deletar = await prisma.categoriaMaterial.delete({ where: { id } });

    return deletar;
  } catch (error) {
    console.log(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return new BadRequest(
          "O id enviado não pertence a nenhum registro existente."
        );
      }
      if (error.code === "P2003") {
        return new NotPossible(
          "Não é possivel excluir uma categoria qual tenha materiais listados."
        );
      }
      throw error;
    }
    throw error;
  }
};
export const findAllCategories = async () => {
  try {
    const categorias = await prisma.categoriaMaterial.findMany();

    return categorias;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const findUniqueCategory = async (id: number) => {
  try {
    const categoria = await prisma.categoriaMaterial.findFirst({
      where: { id },
      include: { materiais: { select: { nome: true } } },
    });

    return categoria;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
