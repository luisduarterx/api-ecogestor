import { Prisma } from "../../generated/prisma/client";
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
  const novaConta = await prisma.$transaction(
    async (trx) => {
      if (conta_padrao) {
        const padraoExist = await trx.contaFinanceira.findFirst({
          where: { conta_padrao: true },
        });
        if (padraoExist) {
          throw new ConflictError(
            "Não é possivel criar a conta. Já existe uma conta padrão definida.",
          );
        }
      }

      return trx.contaFinanceira.create({
        data: {
          nome,
          saldo_inicial,
          conta_padrao: conta_padrao ?? false,
          saldo_atual: saldo_inicial,
          status: status ?? true,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  return {
    ...novaConta,
    saldo_inicial: Number(novaConta.saldo_inicial),
    saldo_atual: Number(novaConta.saldo_atual),
  };
};
const update = async ({ id, data }: EditContaInput) => {
  const contaAtualizada = await prisma.$transaction(
    async (trx) => {
      const contaExist = await trx.contaFinanceira.findUnique({ where: { id } });
      if (!contaExist) {
        throw new NotFound();
      }

      if (data.conta_padrao === true) {
        const padraoExist = await trx.contaFinanceira.findFirst({
          where: { conta_padrao: true, NOT: { id } },
        });
        if (padraoExist) {
          throw new ConflictError(
            "Não é possivel editar a conta. Já existe uma conta padrão definida.",
          );
        }
      }

      if (
        contaExist.conta_padrao &&
        (data.conta_padrao === false || data.status === false)
      ) {
        const caixaAberto = await trx.caixa.findFirst({
          where: { conta_id: id, status: "ABERTO" },
          select: { id: true },
        });
        if (caixaAberto) {
          throw new ConflictError(
            "A conta padrão não pode ser alterada enquanto houver caixa aberto.",
          );
        }
      }

      return trx.contaFinanceira.update({
        where: { id },
        data: {
          nome: data.nome,
          conta_padrao: data.conta_padrao,
          status: data.status,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  return {
    ...contaAtualizada,
    saldo_inicial: Number(contaAtualizada.saldo_inicial),
    saldo_atual: Number(contaAtualizada.saldo_atual),
  };
};
const deleteUnique = async (id: number) => {
  const contaExist = await prisma.contaFinanceira.findUnique({
    where: { id },
  });

  if (!contaExist) {
    throw new NotFound();
  }

  if (contaExist.conta_padrao) {
    throw new ConflictError("Não é possível desativar a conta padrão.");
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
};
const getByID = async (id: number) => {
  const contaExist = await prisma.contaFinanceira.findUnique({
    where: { id },
  });

  if (!contaExist) {
    throw new NotFound();
  }

  return {
    ...contaExist,
    saldo_inicial: Number(contaExist.saldo_inicial),
    saldo_atual: Number(contaExist.saldo_atual),
  };
};
const findAll = async () => {
  const contasEncontradas = await prisma.contaFinanceira.findMany();

  return contasEncontradas.map((conta) => ({
    ...conta,
    saldo_atual: Number(conta.saldo_atual),
    saldo_inicial: Number(conta.saldo_inicial),
  }));
};

const contaFinanceira = {
  create,
  update,
  deleteUnique,
  getByID,
  findAll,
};

export default contaFinanceira;
