import { ParamsFindMaterial } from "../controllers/materiais";
import { NotFound, NotPossible } from "../error";
import { Prisma } from "../generated/prisma";
import { prisma } from "../libs/prisma";
import { EditMaterialType, MaterialType } from "../types/materiais";

export const createMaterial = async (data: MaterialType) => {
  try {
    const result = await prisma.$transaction(async (trx) => {
      const material = await trx.material.create({
        data: {
          catID: data.catID,
          nome: data.nome,
          v_venda: data.v_venda,
          estoque: 0,
        },
      });

      const tabela = await trx.precoPorTabela.create({
        data: {
          materialID: material.id,
          v_compra: data.v_compra,
          tabelaID: parseInt(process.env.TABELA_PADRAO as string),
        },
      });
      return {
        id: material.id,
        nome: material.nome,
        catID: material.catID,
        v_compra: parseFloat(tabela.v_compra.toString()),
        v_venda: parseFloat(material.v_venda.toString()),
        estoque: parseFloat(material.estoque.toString()),
      };
    });
    return result;
  } catch (error) {
    console.log(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return new NotPossible(
          "Não é possivel criar um material em um categoria inexistente."
        );
      }
      throw error;
    }

    throw error;
  }
};
export const updateMaterial = async (id: number, data: EditMaterialType) => {
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
        v_venda: parseFloat(material.v_venda.toString()),
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
          "Não é possivel criar um material em um categoria inexistente."
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
export const findAllMateriais = async ({
  catID,
  order,
  search,
}: ParamsFindMaterial) => {
  try {
    console.log(search);
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
        catID: catID ? parseInt(catID.toString()) : undefined,
        status: true,
        preco_tabela: {
          some: {
            tabelaID: parseInt(process.env.TABELA_PADRAO as string),
          },
        },
      },
      include: {
        preco_tabela: {
          where: {
            tabelaID: parseInt(process.env.TABELA_PADRAO as string),
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
      v_compra: parseFloat(mat.preco_tabela[0].v_compra.toString()),
      v_venda: parseFloat(mat.v_venda.toString()),
      estoque: parseFloat(mat.estoque.toString()),
    }));
  } catch (error) {
    console.log(error);
    throw error;
  }
};
