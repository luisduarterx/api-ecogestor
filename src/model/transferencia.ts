import { Prisma } from "../../generated/prisma/client";
import { ConflictError, NotFound } from "../error";
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

type FindAllTransferenciasInput = {
  dataInicial?: string;
  dataFinal?: string;
};

const serializarMovimentacao = <T extends {
  saldo_inicial: Prisma.Decimal;
  valor: Prisma.Decimal;
  saldo_final: Prisma.Decimal;
}>(movimentacao: T) => ({
  ...movimentacao,
  saldo_inicial: movimentacao.saldo_inicial.toNumber(),
  valor: movimentacao.valor.toNumber(),
  saldo_final: movimentacao.saldo_final.toNumber(),
});

const caixaDaContaPadrao = async (
  trx: Prisma.TransactionClient,
  contas: Array<{ id: number; conta_padrao: boolean }>,
) => {
  const contaPadrao = contas.find((conta) => conta.conta_padrao);
  if (!contaPadrao) return null;

  const caixa = await trx.caixa.findFirst({
    where: { conta_id: contaPadrao.id, status: "ABERTO" },
    orderBy: { id: "desc" },
  });
  if (!caixa) {
    throw new ConflictError(
      "A conta padrão não pode ser movimentada sem um caixa aberto.",
    );
  }
  return caixa;
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

  return prisma.$transaction(
    async (trx) => {
      const [contaOrigemAtual, contaDestinoAtual] = await Promise.all([
        trx.contaFinanceira.findUnique({ where: { id: conta_origem_id } }),
        trx.contaFinanceira.findUnique({ where: { id: conta_destino_id } }),
      ]);

      if (!contaOrigemAtual || !contaDestinoAtual) {
        throw new NotFound("A conta selecionada não foi encontrada.");
      }
      if (!contaOrigemAtual.status || !contaDestinoAtual.status) {
        throw new ConflictError(
          "Não é possível transferir valores utilizando uma conta inativa.",
        );
      }

      const caixa = await caixaDaContaPadrao(trx, [
        contaOrigemAtual,
        contaDestinoAtual,
      ]);
      const contaOrigem = await trx.contaFinanceira.update({
        where: { id: conta_origem_id },
        data: { saldo_atual: { decrement: valor } },
      });
      const contaDestino = await trx.contaFinanceira.update({
        where: { id: conta_destino_id },
        data: { saldo_atual: { increment: valor } },
      });
      const caixaOrigemId = contaOrigemAtual.conta_padrao ? caixa?.id : null;
      const caixaDestinoId = contaDestinoAtual.conta_padrao ? caixa?.id : null;
      const descricaoNormalizada = descricao?.trim();

      const novaTransferencia = await trx.transferenciaFinanceira.create({
        data: {
          conta_origem_id,
          conta_destino_id,
          valor,
          descricao: `de ID ${conta_origem_id} P/ ID ${conta_destino_id}${
            descricaoNormalizada ? ` - ${descricaoNormalizada}` : ""
          }`,
          user_id,
          caixa_id: caixa?.id,
          movimentacoes: {
            create: [
              {
                conta_id: conta_origem_id,
                direcao: "SAIDA",
                descricao: `Transferência p/ ${contaDestino.nome}`,
                origem: "TRANSFERENCIA",
                saldo_inicial: contaOrigemAtual.saldo_atual,
                saldo_final: contaOrigem.saldo_atual,
                valor,
                caixa_id: caixaOrigemId,
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
                caixa_id: caixaDestinoId,
                user_id,
              },
            ],
          },
        },
        include: { movimentacoes: true },
      });

      return {
        ...novaTransferencia,
        valor: novaTransferencia.valor.toNumber(),
        movimentacoes: novaTransferencia.movimentacoes.map(
          serializarMovimentacao,
        ),
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
};

const reverse = async ({ id, motivo, user_id }: EstornoTransferenciaInput) => {
  if (!motivo.trim()) {
    throw new ConflictError("O motivo do estorno deve ser informado.");
  }

  return prisma.$transaction(
    async (trx) => {
      const transferenciaOriginal =
        await trx.transferenciaFinanceira.findUnique({
          where: { id },
          include: { movimentacoes: true },
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

      const [contaOrigemEstorno, contaDestinoEstorno] = await Promise.all([
        trx.contaFinanceira.findUnique({
          where: { id: transferenciaOriginal.conta_destino_id },
        }),
        trx.contaFinanceira.findUnique({
          where: { id: transferenciaOriginal.conta_origem_id },
        }),
      ]);
      if (!contaOrigemEstorno || !contaDestinoEstorno) {
        throw new NotFound(
          "Uma das contas vinculadas à transferência não foi encontrada.",
        );
      }
      if (!contaOrigemEstorno.status || !contaDestinoEstorno.status) {
        throw new ConflictError(
          "Não é possível estornar a transferência utilizando uma conta inativa.",
        );
      }

      const caixa = await caixaDaContaPadrao(trx, [
        contaOrigemEstorno,
        contaDestinoEstorno,
      ]);
      const valor = transferenciaOriginal.valor;
      const contaOrigemAtualizada = await trx.contaFinanceira.update({
        where: { id: contaOrigemEstorno.id },
        data: { saldo_atual: { decrement: valor } },
      });
      const contaDestinoAtualizada = await trx.contaFinanceira.update({
        where: { id: contaDestinoEstorno.id },
        data: { saldo_atual: { increment: valor } },
      });
      const caixaOrigemId = contaOrigemEstorno.conta_padrao ? caixa?.id : null;
      const caixaDestinoId = contaDestinoEstorno.conta_padrao ? caixa?.id : null;

      const transferenciaEstorno = await trx.transferenciaFinanceira.create({
        data: {
          conta_origem_id: contaOrigemEstorno.id,
          conta_destino_id: contaDestinoEstorno.id,
          valor,
          descricao: `Estorno da transferência #${transferenciaOriginal.id}: ${motivo.trim()}`,
          user_id,
          estorno_de_id: transferenciaOriginal.id,
          caixa_id: caixa?.id,
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
                caixa_id: caixaOrigemId,
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
                caixa_id: caixaDestinoId,
                user_id,
              },
            ],
          },
        },
        include: { movimentacoes: true },
      });

      await trx.transferenciaFinanceira.update({
        where: { id },
        data: {
          estornada: true,
          movimentacoes: {
            updateMany: {
              where: { origem: "TRANSFERENCIA" },
              data: { estornada: true },
            },
          },
        },
      });

      return {
        ...transferenciaEstorno,
        valor: transferenciaEstorno.valor.toNumber(),
        movimentacoes: transferenciaEstorno.movimentacoes.map(
          serializarMovimentacao,
        ),
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
};

const findAll = async ({
  dataInicial,
  dataFinal,
}: FindAllTransferenciasInput) => {
  const transferencias = await prisma.transferenciaFinanceira.findMany({
    where: {
      criado_em:
        dataInicial || dataFinal
          ? {
              gte: dataInicial
                ? new Date(`${dataInicial}T00:00:00.000Z`)
                : undefined,
              lte: dataFinal
                ? new Date(`${dataFinal}T23:59:59.999Z`)
                : undefined,
            }
          : undefined,
    },
    orderBy: { criado_em: "desc" },
  });

  return transferencias.map((transferencia) => ({
    ...transferencia,
    valor: transferencia.valor.toNumber(),
  }));
};

const getByID = async (id: number) => {
  const transferencia = await prisma.transferenciaFinanceira.findUnique({
    where: { id },
    include: { movimentacoes: { orderBy: { id: "asc" } } },
  });
  if (!transferencia) {
    throw new NotFound();
  }

  return {
    ...transferencia,
    valor: transferencia.valor.toNumber(),
    movimentacoes: transferencia.movimentacoes.map(serializarMovimentacao),
  };
};

export default { create, reverse, findAll, getByID };
