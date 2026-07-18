import {
  BadRequest,
  ConflictError,
  InternalError,
  NotFound,
  NotPossible,
} from "../error";
import {
  DirecaoFinanceira,
  OrigemMovimentacao,
  Prisma,
} from "../../generated/prisma/client";
import { prisma } from "../libs/prisma";

export type TransferenciaInput = {
  conta_origem_id: number;
  conta_destino_id: number;
  valor: number;
  user_id: number;
  descricao?: string;
};
export type EstornoTransferenciaInput = {
  id: number;
  motivo: string;
  user_id: number;
};

const create = async ({
  conta_destino_id,
  conta_origem_id,
  valor,
  user_id,
  descricao,
}: TransferenciaInput) => {
  if (conta_origem_id === conta_destino_id) {
    throw new ConflictError(
      "A conta de origem e a conta de destino devem ser diferentes.",
    );
  }

  if (valor <= 0) {
    throw new ConflictError(
      "O valor da transferência deve ser maior que zero.",
    );
  }

  try {
    return await prisma.$transaction(async (trx) => {
      const contaOrigemAtual = await trx.contaFinanceira.findUnique({
        where: {
          id: conta_origem_id,
        },
      });

      const contaDestinoAtual = await trx.contaFinanceira.findUnique({
        where: {
          id: conta_destino_id,
        },
      });

      if (!contaOrigemAtual || !contaDestinoAtual) {
        throw new NotFound("A conta selecionada não foi encontrada.");
      }

      const contaOrigem = await trx.contaFinanceira.update({
        where: {
          id: conta_origem_id,
        },
        data: {
          saldo_atual: { decrement: valor },
        },
      });
      const contaDestino = await trx.contaFinanceira.update({
        where: {
          id: conta_destino_id,
        },
        data: {
          saldo_atual: { increment: valor },
        },
      });

      const caixaAberto = await trx.caixa.findFirst({
        where: {
          status: "ABERTO",
          conta_id: { in: [conta_destino_id, conta_origem_id] },
        },
      });
      let caixa_id = caixaAberto?.id;

      const novaTransferencia = await trx.transferenciaFinanceira.create({
        data: {
          conta_origem_id,
          conta_destino_id,
          valor,
          descricao: `de ID ${conta_origem_id} P/ ID ${conta_destino_id} - ${descricao}`,
          user_id,
          caixa_id,
          movimentacoes: {
            create: [
              //ORIGEM
              {
                conta_id: conta_origem_id,
                direcao: "SAIDA",
                descricao: `Transferência p/ ${contaDestino.nome}`,
                origem: "TRANSFERENCIA",
                saldo_inicial: contaOrigemAtual.saldo_atual,
                saldo_final: contaOrigem.saldo_atual,
                valor,
                caixa_id,
                user_id,
              },
              {
                conta_id: conta_destino_id,
                direcao: "ENTRADA",
                descricao: `Transferência recebida de ${contaOrigem.nome}`,
                origem: "TRANSFERENCIA",
                saldo_inicial: contaDestinoAtual.saldo_atual,
                saldo_final: contaDestino.saldo_atual,
                valor,
                caixa_id,
                user_id,
              },
            ],
          },
        },
        include: { movimentacoes: true },
      });
      return {
        id: novaTransferencia.id,
        conta_origem_id,
        conta_destino_id,
        valor: Number(novaTransferencia.valor),
        descricao: novaTransferencia.descricao,
        criado_em: novaTransferencia.criado_em,
        user_id,
        caixa_id: novaTransferencia.caixa_id,
        movimentacoes: novaTransferencia.movimentacoes.map((mov) => ({
          ...mov,
          saldo_final: Number(mov.saldo_final),
          saldo_inicial: Number(mov.saldo_inicial),
          valor: Number(mov.valor),
        })),
      };
    });
  } catch (error) {
    throw error;
  }
};
const reverse = async ({ id, motivo, user_id }: EstornoTransferenciaInput) => {
  try {
    if (!motivo.trim()) {
      throw new ConflictError("O motivo do estorno deve ser informado.");
    }
    return prisma.$transaction(async (trx) => {
      const transferenciaOriginal =
        await trx.transferenciaFinanceira.findUnique({
          where: {
            id,
          },
          include: {
            movimentacoes: true,
          },
        });
      if (!transferenciaOriginal) {
        throw new NotFound("Transferência não encontrada.");
      }

      if (transferenciaOriginal.estorno_de_id) {
        throw new ConflictError(
          "Uma transferência de estorno não pode ser estornada diretamente.",
        );
      }

      if (transferenciaOriginal.estornada) {
        throw new ConflictError("Esta transferência já foi estornada.");
      }

      const contaOrigemEstorno = await trx.contaFinanceira.findUnique({
        where: {
          id: transferenciaOriginal.conta_destino_id,
        },
      });
      const contaDestinoEstorno = await trx.contaFinanceira.findUnique({
        where: {
          id: transferenciaOriginal.conta_origem_id,
        },
      });

      if (!contaOrigemEstorno || !contaDestinoEstorno) {
        throw new NotFound(
          "Uma das contas vinculadas à transferência não foi encontrada.",
        );
      }
      const valor = transferenciaOriginal.valor;

      const contaOrigemAtualizada = await trx.contaFinanceira.update({
        where: {
          id: contaOrigemEstorno.id,
        },

        data: {
          saldo_atual: {
            decrement: valor,
          },
        },
      });

      const contaDestinoAtualizada = await trx.contaFinanceira.update({
        where: {
          id: contaDestinoEstorno.id,
        },

        data: {
          saldo_atual: {
            increment: valor,
          },
        },
      });

      const caixaAberto = await trx.caixa.findFirst({
        where: {
          status: "ABERTO",
          conta_id: {
            in: [contaOrigemAtualizada.id, contaDestinoAtualizada.id],
          },
        },
      });
      let caixa_id = caixaAberto?.id;

      const transferenciaEstorno = await trx.transferenciaFinanceira.create({
        data: {
          conta_origem_id: contaOrigemEstorno.id,
          conta_destino_id: contaDestinoEstorno.id,
          valor,
          descricao: `Estorno da transferência #${transferenciaOriginal.id}: ${motivo}`,
          user_id,
          estorno_de_id: transferenciaOriginal.id,
          caixa_id,
          movimentacoes: {
            create: [
              {
                conta_id: contaOrigemEstorno.id,
                direcao: "SAIDA",
                origem: "ESTORNO",
                descricao: `Estorno da transferência #${transferenciaOriginal.id}`,
                valor,
                saldo_inicial: contaOrigemEstorno.saldo_atual,
                saldo_final: contaOrigemAtualizada.saldo_atual,
                caixa_id,
                user_id,
              },
              {
                conta_id: contaDestinoEstorno.id,
                direcao: "ENTRADA",
                origem: "ESTORNO",
                descricao: `Estorno da transferência #${transferenciaOriginal.id}`,
                valor,
                saldo_inicial: contaDestinoEstorno.saldo_atual,
                saldo_final: contaDestinoAtualizada.saldo_atual,
                caixa_id,
                user_id,
              },
            ],
          },
        },

        include: {
          movimentacoes: true,
        },
      });

      await trx.transferenciaFinanceira.update({
        where: { id },
        data: {
          estornada: true,
          movimentacoes: {
            updateMany: [
              {
                where: { origem: "TRANSFERENCIA" },
                data: {
                  estornada: true,
                },
              },
            ],
          },
        },
      });
      return {
        id: transferenciaEstorno.id,
        conta_origem_id: contaOrigemAtualizada.id,
        conta_destino_id: contaDestinoAtualizada.id,
        valor: Number(transferenciaEstorno.valor),
        descricao: transferenciaEstorno.descricao,
        criado_em: transferenciaEstorno.criado_em,
        user_id,
        caixa_id: transferenciaEstorno.caixa_id,
        movimentacoes: transferenciaEstorno.movimentacoes.map((mov) => ({
          ...mov,
          saldo_final: Number(mov.saldo_final),
          saldo_inicial: Number(mov.saldo_inicial),
          valor: Number(mov.valor),
        })),
      };
    });
  } catch (error) {
    throw error;
  }
};

type FindAllTransferenciasInput = {
  dataInicial?: string;
  dataFinal?: string;
};

const findAll = async ({
  dataInicial,
  dataFinal,
}: FindAllTransferenciasInput) => {
  if (!dataFinal || !dataInicial) {
    throw new InternalError();
  }
  const dataInicialParse = `${dataInicial}T00:00:00.000Z`;
  const dataFinalParse = `${dataFinal}T23:59:59.999Z`;
  console.log("DATAS", dataFinalParse, dataInicialParse);

  const transferencias = await prisma.transferenciaFinanceira.findMany({
    where: {
      criado_em: {
        gte: dataInicialParse,
        lte: dataFinalParse,
      },
    },

    orderBy: {
      criado_em: "desc",
    },
  });

  return transferencias;
};
const getByID = async (id: number) => {
  try {
    const transfExist = await prisma.transferenciaFinanceira.findUnique({
      where: { id },
    });

    if (!transfExist?.id) {
      throw new NotFound();
    }

    return { ...transfExist, valor: Number(transfExist.valor) };
  } catch (error) {
    throw error;
  }
};

const transferenciaFinanceira = {
  create,
  reverse,
  findAll,
  getByID,
};

export default transferenciaFinanceira;
// parei aqui nas asteracoes feitas em tipomovimentacao
