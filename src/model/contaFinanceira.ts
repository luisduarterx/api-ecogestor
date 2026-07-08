import { ConflictError, NotFound } from "../error";
import { prisma } from "../libs/prisma";

type ContaInput = {
  nome: string;
  conta_padrao?: boolean;
  saldo_inicial: number;
  status?: boolean;
};
type EditContaInput = {
  id: number;
  data: {
    nome?: string;
    conta_padrao?: boolean;
    status?: boolean;
  };
};
const create = async ({
  nome,
  conta_padrao,
  saldo_inicial,
  status,
}: ContaInput) => {
  try {
    if (conta_padrao) {
      const padraoExist = await prisma.contaFinanceira.findFirst({
        where: {
          conta_padrao: true,
        },
      });
      if (padraoExist?.id) {
        throw new ConflictError(
          "Não é possivel criar a conta. Já existe uma conta padrão definida.",
        );
      }
    }

    const novaConta = await prisma.contaFinanceira.create({
      data: {
        nome,
        saldo_inicial,
        conta_padrao: conta_padrao || undefined,
        saldo_atual: saldo_inicial,
        status: status || undefined,
      },
    });
    return {
      ...novaConta,
      saldo_inicial: Number(novaConta.saldo_inicial),
      saldo_atual: Number(novaConta.saldo_atual),
    };
  } catch (error) {
    throw error;
  }
};
const update = async ({ id, data }: EditContaInput) => {
  try {
    console.log(data);
    const contaExist = await prisma.contaFinanceira.findFirst({
      where: { id },
    });

    if (!contaExist?.id) {
      throw new NotFound();
    }
    if (data.conta_padrao) {
      const padraoExist = await prisma.contaFinanceira.findFirst({
        where: {
          conta_padrao: true,
          NOT: {
            id,
          },
        },
      });
      throw new ConflictError(
        "Não é possivel editar a conta. Já existe uma conta padrão definida.",
      );
    }
    const contaAtualizada = await prisma.contaFinanceira.update({
      where: {
        id,
      },
      data: {
        nome: data.nome || undefined,
        conta_padrao: data.conta_padrao ?? undefined,
        status: data.status ?? undefined,
      },
    });

    return {
      ...contaAtualizada,
      saldo_inicial: Number(contaExist.saldo_inicial),
      saldo_atual: Number(contaExist.saldo_atual),
    };
  } catch (error) {
    throw error;
  }
};
const deleteUnique = async (id: number) => {
  try {
    const contaExist = await prisma.contaFinanceira.findFirst({
      where: { id },
    });

    if (!contaExist?.id) {
      throw new NotFound();
    }

    const padraoExist = await prisma.contaFinanceira.findFirst({
      where: {
        conta_padrao: true,
      },
    });
    if (padraoExist?.id === id) {
      throw new ConflictError(
        "Não é possivel criar a conta. Já existe uma conta padrão definida.",
      );
    }
    const contaDeletada = await prisma.contaFinanceira.update({
      where: { id },
      data: {
        status: false,
      },
    });
    return {
      id: contaDeletada.id,
      status: contaDeletada.status,
    };
  } catch (error) {
    throw error;
  }
};
const getByID = async (id: number) => {
  try {
    const contaExist = await prisma.contaFinanceira.findFirst({
      where: { id },
    });

    if (!contaExist?.id) {
      throw new NotFound();
    }

    return {
      ...contaExist,
      saldo_inicial: Number(contaExist.saldo_inicial),
      saldo_atual: Number(contaExist.saldo_atual),
    };
  } catch (error) {
    throw error;
  }
};
const findAll = async () => {
  try {
    const contasEncontradas = await prisma.contaFinanceira.findMany();

    return contasEncontradas.map((conta) => ({
      ...conta,
      saldo_atual: Number(conta.saldo_atual),
      saldo_inicial: Number(conta.saldo_inicial),
    }));
  } catch (error) {
    throw error;
  }
};

const contaFinanceira = {
  create,
  update,
  deleteUnique,
  getByID,
  findAll,
};

export default contaFinanceira;
