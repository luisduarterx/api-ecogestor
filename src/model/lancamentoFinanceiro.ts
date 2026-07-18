import {
  DirecaoFinanceira,
  OrigemMovimentacao,
  Prisma,
  StatusLancamento,
  TipoLancamento,
} from "../../generated/prisma/client";
import { ConflictError, NotFound } from "../error";
import { prisma } from "../libs/prisma";
import categoriaLancamento from "./categoriaLancamento";

type LancamentoInput = {
  valor: string;
  descricao: string;
  tipo: TipoLancamento;
  titulo: string;
  parcela?: number;
  categoria_id: number;
  vencimento: Date;
  desconto?: string;
  acrescimo?: string;
  registro_id?: number;
  user_id: number;
};

type LancamentoUpdateInput = Partial<
  Omit<LancamentoInput, "tipo" | "user_id">
> & {
  id: number;
};

type ListagemInput = {
  status?: StatusLancamento;
  tipo?: TipoLancamento;
  categoria_id?: number;
  registro_id?: number;
  pedido_id?: number;
  vencimento_inicial?: Date;
  vencimento_final?: Date;
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

const serializarLancamento = <T extends {
  valor: Prisma.Decimal;
  desconto: Prisma.Decimal;
  acrescimo: Prisma.Decimal;
  movimentacoes?: Array<{
    saldo_inicial: Prisma.Decimal;
    valor: Prisma.Decimal;
    saldo_final: Prisma.Decimal;
  }>;
}>(lancamento: T) => ({
  ...lancamento,
  valor: lancamento.valor.toNumber(),
  desconto: lancamento.desconto.toNumber(),
  acrescimo: lancamento.acrescimo.toNumber(),
  ...(lancamento.movimentacoes
    ? {
        movimentacoes: lancamento.movimentacoes.map(serializarMovimentacao),
      }
    : {}),
});

const criar = async (input: LancamentoInput) => {
  await categoriaLancamento.validarTipo(
    prisma,
    input.categoria_id,
    input.tipo,
  );
  if (input.registro_id) {
    const registro = await prisma.registro.findUnique({
      where: { id: input.registro_id },
    });
    if (!registro || registro.deletedAt) {
      throw new NotFound("Registro não encontrado.");
    }
  }
  const lancamento = await prisma.lancamentoFinanceiro.create({
    data: {
      ...input,
      valor: new Prisma.Decimal(input.valor),
      desconto: new Prisma.Decimal(input.desconto ?? 0),
      acrescimo: new Prisma.Decimal(input.acrescimo ?? 0),
      status: "ABERTO",
    },
    include: { categoria: true, registro: true },
  });
  return serializarLancamento(lancamento);
};

const listar = async (filtros: ListagemInput) => {
  const lancamentos = await prisma.lancamentoFinanceiro.findMany({
    where: {
      status: filtros.status,
      tipo: filtros.tipo,
      categoria_id: filtros.categoria_id,
      registro_id: filtros.registro_id,
      pedido_id: filtros.pedido_id,
      vencimento:
        filtros.vencimento_inicial || filtros.vencimento_final
          ? {
              gte: filtros.vencimento_inicial,
              lte: filtros.vencimento_final,
            }
          : undefined,
    },
    include: { categoria: true, registro: true },
    orderBy: [{ vencimento: "asc" }, { id: "asc" }],
  });
  return lancamentos.map(serializarLancamento);
};

const buscarPorId = async (id: number) => {
  const lancamento = await prisma.lancamentoFinanceiro.findUnique({
    where: { id },
    include: {
      categoria: true,
      registro: true,
      movimentacoes: { orderBy: { id: "asc" } },
    },
  });
  if (!lancamento) {
    throw new NotFound("Lançamento financeiro não encontrado.");
  }
  return serializarLancamento(lancamento);
};

const atualizar = async ({ id, ...data }: LancamentoUpdateInput) => {
  const atual = await prisma.lancamentoFinanceiro.findUnique({ where: { id } });
  if (!atual) {
    throw new NotFound("Lançamento financeiro não encontrado.");
  }
  if (atual.status !== "ABERTO") {
    throw new ConflictError("Somente lançamentos abertos podem ser editados.");
  }
  if (atual.pedido_id) {
    throw new ConflictError(
      "Lançamentos gerados por pedido não podem ser editados manualmente.",
    );
  }
  if (data.categoria_id) {
    await categoriaLancamento.validarTipo(
      prisma,
      data.categoria_id,
      atual.tipo,
    );
  }
  const lancamento = await prisma.lancamentoFinanceiro.update({
    where: { id },
    data: {
      ...data,
      valor: data.valor ? new Prisma.Decimal(data.valor) : undefined,
      desconto: data.desconto ? new Prisma.Decimal(data.desconto) : undefined,
      acrescimo: data.acrescimo ? new Prisma.Decimal(data.acrescimo) : undefined,
    },
    include: { categoria: true, registro: true },
  });
  return serializarLancamento(lancamento);
};

const baixar = async (id: number, conta_id: number, user_id: number) =>
  prisma.$transaction(async (trx) => {
    const lancamento = await trx.lancamentoFinanceiro.findUnique({
      where: { id },
    });
    if (!lancamento) {
      throw new NotFound("Lançamento financeiro não encontrado.");
    }
    if (lancamento.status !== "ABERTO") {
      throw new ConflictError("Somente lançamentos abertos podem ser baixados.");
    }
    const conta = await trx.contaFinanceira.findUnique({
      where: { id: conta_id },
    });
    if (!conta || !conta.status) {
      throw new NotFound("Conta financeira ativa não encontrada.");
    }
    const caixa = conta.conta_padrao
      ? await trx.caixa.findFirst({
          where: { conta_id, status: "ABERTO" },
          orderBy: { id: "desc" },
        })
      : null;
    if (conta.conta_padrao && !caixa) {
      throw new ConflictError(
        "A conta padrão não pode ser movimentada sem um caixa aberto.",
      );
    }
    const valorBaixa = lancamento.valor
      .minus(lancamento.desconto)
      .plus(lancamento.acrescimo);
    if (valorBaixa.lessThanOrEqualTo(0)) {
      throw new ConflictError("O valor líquido da baixa deve ser positivo.");
    }
    const entrada = lancamento.tipo === "RECEBER";
    const saldoFinal = entrada
      ? conta.saldo_atual.plus(valorBaixa)
      : conta.saldo_atual.minus(valorBaixa);
    await trx.contaFinanceira.update({
      where: { id: conta_id },
      data: { saldo_atual: saldoFinal },
    });
    await trx.lancamentoFinanceiro.update({
      where: { id },
      data: { status: "PAGO", data_baixa: new Date() },
    });
    const movimentacao = await trx.movimentacaoFinanceira.create({
      data: {
        conta_id,
        origem: entrada ? "LANCAMENTO_RECEBER" : "LANCAMENTO_PAGAR",
        origem_id: id,
        descricao: `Baixa do lançamento #${id} - ${lancamento.titulo}`,
        direcao: entrada ? "ENTRADA" : "SAIDA",
        saldo_inicial: conta.saldo_atual,
        valor: valorBaixa,
        saldo_final: saldoFinal,
        user_id,
        lancamento_id: id,
        caixa_id: caixa?.id,
      },
    });
    return buscarPorIdComCliente(trx, id, movimentacao.id);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

const buscarPorIdComCliente = async (
  trx: Prisma.TransactionClient,
  id: number,
  movimentacaoId?: number,
) => {
  const lancamento = await trx.lancamentoFinanceiro.findUniqueOrThrow({
    where: { id },
    include: { categoria: true, registro: true, movimentacoes: true },
  });
  const resposta = serializarLancamento(lancamento);
  return movimentacaoId
    ? { ...resposta, movimentacao_id: movimentacaoId }
    : resposta;
};

const cancelar = async (id: number) => {
  const lancamento = await prisma.lancamentoFinanceiro.findUnique({ where: { id } });
  if (!lancamento) {
    throw new NotFound("Lançamento financeiro não encontrado.");
  }
  if (lancamento.status !== "ABERTO") {
    throw new ConflictError("Somente lançamentos abertos podem ser cancelados.");
  }
  if (lancamento.pedido_id) {
    throw new ConflictError(
      "Lançamentos gerados por pedido não podem ser cancelados manualmente.",
    );
  }
  const cancelado = await prisma.lancamentoFinanceiro.update({
    where: { id },
    data: { status: "CANCELADO" },
    include: { categoria: true, registro: true },
  });
  return serializarLancamento(cancelado);
};

const estornar = async (id: number, motivo: string, user_id: number) =>
  prisma.$transaction(async (trx) => {
    const lancamento = await trx.lancamentoFinanceiro.findUnique({
      where: { id },
      include: {
        movimentacoes: {
          where: { estornada: false, estorno_de_id: null },
          orderBy: { id: "desc" },
          take: 1,
        },
      },
    });
    if (!lancamento) {
      throw new NotFound("Lançamento financeiro não encontrado.");
    }
    if (lancamento.status !== "PAGO" || !lancamento.movimentacoes[0]) {
      throw new ConflictError("O lançamento não possui uma baixa ativa para estornar.");
    }
    const original = lancamento.movimentacoes[0];
    const conta = await trx.contaFinanceira.findUnique({
      where: { id: original.conta_id },
    });
    if (!conta) {
      throw new NotFound("Conta financeira não encontrada.");
    }
    const caixa = conta.conta_padrao
      ? await trx.caixa.findFirst({
          where: { conta_id: conta.id, status: "ABERTO" },
          orderBy: { id: "desc" },
        })
      : null;
    if (conta.conta_padrao && !caixa) {
      throw new ConflictError(
        "A conta padrão não pode ser movimentada sem um caixa aberto.",
      );
    }
    const direcao: DirecaoFinanceira =
      original.direcao === "ENTRADA" ? "SAIDA" : "ENTRADA";
    const saldoFinal =
      direcao === "ENTRADA"
        ? conta.saldo_atual.plus(original.valor)
        : conta.saldo_atual.minus(original.valor);
    await trx.contaFinanceira.update({
      where: { id: conta.id },
      data: { saldo_atual: saldoFinal },
    });
    await trx.movimentacaoFinanceira.update({
      where: { id: original.id },
      data: { estornada: true },
    });
    await trx.movimentacaoFinanceira.create({
      data: {
        conta_id: conta.id,
        origem: OrigemMovimentacao.ESTORNO,
        origem_id: id,
        descricao: `Estorno da baixa do lançamento #${id}: ${motivo}`,
        direcao,
        saldo_inicial: conta.saldo_atual,
        valor: original.valor,
        saldo_final: saldoFinal,
        user_id,
        lancamento_id: id,
        caixa_id: caixa?.id,
        estorno_de_id: original.id,
      },
    });
    await trx.lancamentoFinanceiro.update({
      where: { id },
      data: { status: "ABERTO", data_baixa: null },
    });
    return buscarPorIdComCliente(trx, id);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

export default {
  criar,
  listar,
  buscarPorId,
  atualizar,
  baixar,
  cancelar,
  estornar,
};
