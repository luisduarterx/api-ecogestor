import { ParamsFindMaterial } from "../controllers/materiais";
import {
  InternalError,
  NotFound,
  NotPossible,
  ValidationError,
} from "../error";
import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../libs/prisma";
import { EditMaterialType, MaterialType } from "../types/materiais";
import categoria from "./categorias";

export const create = async (data: MaterialType) => {
  try {
    const defaultTable = await findDefaultTable();
    const nameExist = await prisma.material.findFirst({
      where: {
        nome: data.nome.toUpperCase(),
      },
    });
    if (nameExist?.id) {
      throw new ValidationError(
        "Não é possivel criar um material com o nome duplicado.",
      );
    }

    const result = await prisma.$transaction(async (trx) => {
      const material = await trx.material.create({
        data: {
          catID: data.catID,
          nome: data.nome.toUpperCase(),
          preco_venda: data.preco_venda,
        },
        include: {
          categoria: true,
        },
      });

      const tabela = await trx.precoPorTabela.create({
        data: {
          materialID: material.id,
          v_compra: data.preco_compra,
          tabelaID: defaultTable.id,
        },
      });
      return {
        id: material.id,
        nome: material.nome,
        categoria: material.categoria,
        preco_compra: Number(tabela.v_compra),
        preco_venda: Number(material.preco_venda),
        criado_em: material.criado_em,
        editado_em: material.editado_em,
        status: material.status,
      };
    });
    return result;
  } catch (error) {
    throw error;
  }
};
export const update = async (id: number, data: EditMaterialType) => {
  try {
    console.log(data);
    const result = await prisma.$transaction(async (trx) => {
      const material = await trx.material.update({
        where: {
          id,
        },
        data: {
          catID: data.catID,
          nome: data.nome,
          v_venda: data.v_venda,
          status: data.status,
        },
      });

      if (data.v_compra) {
        const tabela = await trx.precoPorTabela.updateMany({
          where: {
            materialID: material.id,
            tabelaID: 1,
          },
          data: {
            v_compra: data.v_compra,
          },
        });
      }

      return {
        id: material.id,
        nome: material.nome,
        catID: material.catID,
        v_venda: parseFloat(material.preco_venda.toString()),
        v_compra: data.v_compra,
        status: material.status,
      };
    });
    return result;
  } catch (error) {
    console.log(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return new NotPossible(
          "Não é possivel criar um material em um categoria inexistente.",
        );
      }
      if (error.code === "P2025") {
        return new NotFound();
      }
      throw error;
    }
    throw error;
  }
};
export const findAll = async ({ catID, order, search }: ParamsFindMaterial) => {
  try {
    const defaultTable = await findDefaultTable();

    const materiais = await prisma.material.findMany({
      orderBy: order ? { [order]: "asc" } : undefined,
      where: {
        OR: search
          ? [
              { nome: { contains: search, mode: "insensitive" } },
              ...(Number.isInteger(Number(search))
                ? [{ id: Number(search) }]
                : []),
            ]
          : undefined,
        AND: {
          catID: catID ? catID : undefined,
          status: true,
          preco_tabela: {
            some: {
              tabelaID: defaultTable.id,
            },
          },
        },
      },
      include: {
        preco_tabela: {
          where: {
            tabelaID: defaultTable.id,
          },
          select: { v_compra: true },
          take: 1,
        },
      },
    });
    return materiais.map((mat) => ({
      id: mat.id,
      nome: mat.nome,
      catID: mat.catID,
      preco_compra: mat.preco_tabela[0].v_compra,
      preco_venda: mat.preco_venda,
      editado_em: mat.editado_em,
    }));
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const getByID = async (id: number) => {
  try {
    const defaultTable = await findDefaultTable();
    const material = await prisma.material.findUnique({
      where: { id, status: true },
      include: {
        categoria: true,
        preco_tabela: {
          where: {
            tabelaID: defaultTable.id,
          },
          select: {
            v_compra: true,
          },
        },
      },
    });

    if (!material) {
      throw new NotFound();
    }

    return {
      id: material.id,
      nome: material.nome,
      preco_compra: Number(material.preco_tabela[0].v_compra),
      preco_venda: Number(material.preco_venda),
      categoria: material.categoria,
      editado_em: material.editado_em,
      status: material.status,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const deleteUnique = async (id: number) => {};

async function findDefaultTable() {
  const defaultTable = await prisma.tabela.findFirst({
    where: {
      nome: "PADRAO",
    },
  });
  if (!defaultTable?.id) {
    throw new InternalError(
      "O sistema não conseguiu encontrar a tabela 'PADRAO'.",
    );
  }
  return defaultTable;
}
const material = {
  create,
  update,
  deleteUnique,
  findAll,
  getByID,
};

export default material;
