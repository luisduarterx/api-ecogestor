import { NotFound } from "../error";
import { prisma } from "../libs/prisma";

interface bancoInput {
  nome: string;
  descricao: string;
  status?: boolean;
  saldo_inicial: number;
}
type editBancoInput = {
  nome?: string;
  descricao?: string;
  status?: boolean;
  saldo_inicial?: number;
};

const getByID = async (id: number) => {
  try {
    const bancoExist = await prisma.banco.findFirst({
      where: {
        id: id,
      },
    });
    if (!bancoExist?.id) {
      throw new NotFound();
    }
    return {
      id: bancoExist.id,
      nome: bancoExist.nome,
      descricao: bancoExist.descricao,
      saldo_inicial: Number(bancoExist.saldo),
      status: bancoExist.status,
    };
  } catch (error) {
    throw error;
  }
};
const findAll = async (data: { filters?: string }) => {
  try {
    const result = await prisma.banco.findMany({
      where: { status: true },
    });

    return result;
  } catch (error) {
    throw error;
  }
};
const create = async (data: bancoInput) => {
  try {
    const banco = await prisma.banco.create({
      data: {
        nome: data.nome,
        descricao: data.descricao,
        saldo: data.saldo_inicial,
        status: data.status ?? undefined,
      },
    });
    return {
      id: banco.id,
      nome: banco.nome,
      descricao: banco.descricao,
      saldo_inicial: Number(banco.saldo),
      status: banco.status,
    };
  } catch (error) {
    throw error;
  }
};
const update = async (props: { id: number; data: editBancoInput }) => {
  try {
    const bancoExist = await prisma.banco.findFirst({
      where: {
        id: props.id,
      },
    });
    if (!bancoExist?.id) {
      throw new NotFound();
    }
    const bancoAtualizado = await prisma.banco.update({
      where: { id: props.id },
      data: props.data,
    });
    return {
      id: bancoAtualizado.id,
      nome: bancoAtualizado.nome,
      descricao: bancoAtualizado.descricao,
      saldo_inicial: Number(bancoAtualizado.saldo),
      status: bancoAtualizado.status,
    };
  } catch (error) {
    throw error;
  }
};
const deleteUnique = async (id: number) => {
  try {
    const bancoExist = await prisma.banco.findFirst({
      where: {
        id: id,
      },
    });
    if (!bancoExist?.id) {
      throw new NotFound();
    }
    const bancoDeletado = await prisma.banco.update({
      where: { id: id },
      data: {
        status: false,
      },
    });
    return {
      id: bancoDeletado.id,
      status: bancoDeletado.status,
    };
  } catch (error) {
    throw error;
  }
};

const banco = {
  getByID,
  findAll,
  create,
  update,
  deleteUnique,
};

export default banco;
