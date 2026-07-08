import { ConflictError, NotFound } from "../error";
import { prisma } from "../libs/prisma";
export type TableInput = {
  nome: string;
  padrao?: boolean;
  materiais?: {
    id: number;
    preco_compra: number;
  }[];
};
type EditTableInput = {
  id: number;
  data: {
    nome?: string;
    padrao?: boolean;
    materiais?: {
      id: number;
      preco_compra: number;
    }[];
  };
};

const findPriceOnTable = async (materialID: number, tabelaID: number) => {
  try {
    const PriceInTable = await prisma.precoPorTabela.findFirst({
      where: { materialID, tabelaID },
      select: { v_compra: true },
    });

    return PriceInTable?.v_compra;
  } catch (error) {}
};

const create = async (props: TableInput) => {
  try {
    if (props.padrao) {
      const ExistPadrao = await prisma.tabela.findFirst({
        where: { padrao: true },
      });
      if (ExistPadrao?.id) {
        throw new ConflictError(
          "Não foi possivel criar a tabela. Já existe uma tabela padrão definida.",
        );
      }
    }
    const tabelaNova = await prisma.tabela.create({
      data: {
        nome: props.nome.toUpperCase(),
        padrao: props.padrao || undefined,
        materiais: props.materiais?.length
          ? {
              createMany: {
                data: props.materiais.map((material) => ({
                  materialID: material.id,

                  v_compra: material.preco_compra,
                })),
              },
            }
          : undefined,
      },
      include: {
        materiais: true,
      },
    });

    return tabelaNova;
  } catch (error) {
    throw error;
  }
};
const update = async ({ id, data }: EditTableInput) => {
  try {
    const result = await prisma.$transaction(async (trx) => {
      if (data.padrao) {
        const ExistPadrao = await prisma.tabela.findFirst({
          where: { padrao: true, NOT: { id } },
        });
        if (ExistPadrao?.id) {
          throw new ConflictError(
            "Não foi possivel editar a tabela. Já existe uma tabela padrão definida.",
          );
        }
      }
      const tabela = await trx.tabela.findFirst({
        where: {
          id,
        },
        include: {
          materiais: true,
        },
      });

      if (!tabela?.id) {
        throw new NotFound();
      }

      await trx.tabela.update({
        where: { id },
        data: {
          nome: data.nome || undefined,
          padrao: data.padrao || undefined,
        },
      });

      if (data.materiais !== undefined) {
        const materiaisRecebidos = data.materiais;
        const materiaisID = materiaisRecebidos.map((material) => material.id);

        await trx.precoPorTabela.deleteMany({
          where: {
            materialID: { notIn: materiaisID },
          },
        });

        for (const material of materiaisRecebidos) {
          await trx.precoPorTabela.upsert({
            where: {
              tabelaID_materialID: {
                tabelaID: tabela.id,
                materialID: material.id,
              },
            },
            update: {
              v_compra: material.preco_compra,
            },
            create: {
              tabelaID: tabela.id,
              materialID: material.id,
              v_compra: material.preco_compra,
            },
          });
        }
      }
      return await trx.tabela.findFirst({
        where: { id },
        include: { materiais: true },
      });
    });

    return {
      ...result,
      materiais: result?.materiais.map((material) => ({
        id: material.id,
        editadoEm: material.editadoEm,
        preco_compra: Number(material.v_compra),
        tabelaID: material.tabelaID,
        materialID: material.materialID,
      })),
    };
  } catch (error) {
    throw error;
  }
};
const findAll = async () => {
  try {
    const tabelasEncontradas = await prisma.tabela.findMany();

    return tabelasEncontradas;
  } catch (error) {
    throw error;
  }
};
const deleteUnique = async (id: number) => {
  try {
    const trx = await prisma.$transaction(async (trx) => {
      const tabelaExist = await trx.tabela.findFirst({ where: { id } });

      if (!tabelaExist?.id) {
        throw new NotFound();
      }
      if (tabelaExist.padrao) {
        throw new ConflictError(
          "Não é possível deletar a tabela padrão.",
          "Para deletar a tabela desejado, primeiro cadastre uma nova tabela padrão.",
        );
      }
      await trx.precoPorTabela.deleteMany({
        where: { tabelaID: tabelaExist.id },
      });
      const TabelaDeletada = await trx.tabela.delete({ where: { id } });

      return TabelaDeletada;
    });
    return {
      id: trx.id,
      deletada: true,
    };
  } catch (error) {
    throw error;
  }
};
const getByID = async (id: number) => {
  try {
    const tabelaEncontrada = await prisma.tabela.findUnique({
      where: { id },
      include: { materiais: true },
    });

    if (!tabelaEncontrada?.id) {
      throw new NotFound();
    }

    return tabelaEncontrada;
  } catch (error) {
    throw error;
  }
};

const tabela = {
  create,
  update,
  findAll,
  deleteUnique,
  getByID,
  findPriceOnTable,
};

export default tabela;
