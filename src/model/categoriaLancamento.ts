import {
  Prisma,
  TipoCategoria,
  TipoLancamento,
} from "../../generated/prisma/client";
import { ConflictError, NotFound } from "../error";
import { prisma } from "../libs/prisma";

export type CategoriaLancamentoInput = {
  nome: string;
  tipo: TipoCategoria;
};

const tipoCategoriaPorLancamento: Record<TipoLancamento, TipoCategoria> = {
  PAGAR: "DESPESA",
  RECEBER: "RECEITA",
};

const criar = async ({ nome, tipo }: CategoriaLancamentoInput) => {
  const existente = await prisma.categoriaLancamento.findFirst({
    where: { nome: { equals: nome, mode: "insensitive" } },
  });
  if (existente) {
    throw new ConflictError("Já existe uma categoria com este nome.");
  }
  return prisma.categoriaLancamento.create({
    data: { nome, TipoCategoria: tipo },
  });
};

const listar = (tipo?: TipoCategoria) =>
  prisma.categoriaLancamento.findMany({
    where: { TipoCategoria: tipo },
    orderBy: { nome: "asc" },
  });

const buscarPorId = async (id: number) => {
  const categoria = await prisma.categoriaLancamento.findUnique({
    where: { id },
  });
  if (!categoria) {
    throw new NotFound("Categoria de lançamento não encontrada.");
  }
  return categoria;
};

const atualizar = async (
  id: number,
  data: Partial<CategoriaLancamentoInput>,
) => {
  const categoria = await prisma.categoriaLancamento.findUnique({
    where: { id },
    include: { lancamentos: { take: 1 } },
  });
  if (!categoria) {
    throw new NotFound("Categoria de lançamento não encontrada.");
  }
  if (
    data.tipo &&
    data.tipo !== categoria.TipoCategoria &&
    categoria.lancamentos.length > 0
  ) {
    throw new ConflictError(
      "Não é possível alterar o tipo de uma categoria já utilizada.",
    );
  }
  if (data.nome) {
    const duplicada = await prisma.categoriaLancamento.findFirst({
      where: {
        nome: { equals: data.nome, mode: "insensitive" },
        NOT: { id },
      },
    });
    if (duplicada) {
      throw new ConflictError("Já existe uma categoria com este nome.");
    }
  }
  return prisma.categoriaLancamento.update({
    where: { id },
    data: { nome: data.nome, TipoCategoria: data.tipo },
  });
};

const remover = async (id: number) => {
  const categoria = await prisma.categoriaLancamento.findUnique({
    where: { id },
    include: { lancamentos: { take: 1 } },
  });
  if (!categoria) {
    throw new NotFound("Categoria de lançamento não encontrada.");
  }
  if (categoria.lancamentos.length > 0) {
    throw new ConflictError(
      "Não é possível excluir uma categoria que possui lançamentos.",
    );
  }
  return prisma.categoriaLancamento.delete({ where: { id } });
};

const validarTipo = async (
  client: Prisma.TransactionClient | typeof prisma,
  categoria_id: number,
  tipoLancamento: TipoLancamento,
) => {
  const categoria = await client.categoriaLancamento.findUnique({
    where: { id: categoria_id },
  });
  if (!categoria) {
    throw new NotFound("Categoria de lançamento não encontrada.");
  }
  if (
    categoria.TipoCategoria !== tipoCategoriaPorLancamento[tipoLancamento]
  ) {
    throw new ConflictError(
      "A categoria informada não corresponde ao tipo do lançamento.",
    );
  }
  return categoria;
};

export default { criar, listar, buscarPorId, atualizar, remover, validarTipo };
