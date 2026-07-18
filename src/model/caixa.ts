import { Prisma } from "../../generated/prisma/client";
import {
  DirecaoFinanceira,
  OrigemMovimentacao,
  StatusCaixa,
} from "../../generated/prisma/enums";
import { ConflictError, NotFound } from "../error";
import { prisma } from "../libs/prisma";

type CaixaInput = {
  observacao?: string;
  user_id: number;
};

type ConsultaCaixasInput = {
  dataFinal?: Date;
  dataInicial?: Date;
};

type FechamentoCaixaInput = {
  user_id: number;
  observacao?: string;
  motivo?: string;
  saldo_informado: string | number | Prisma.Decimal;
};

const decimalZero = new Prisma.Decimal(0);

const abrir = async ({ user_id, observacao }: CaixaInput) => {
  return prisma.$transaction(
    async (trx) => {
      const contaPadrao = await trx.contaFinanceira.findFirst({
        where: {
          conta_padrao: true,
          status: true,
        },
      });

      if (!contaPadrao) {
        throw new ConflictError(
          "O sistema não tem uma conta padrão definida.",
          "Defina uma conta padrão nos parametros do sistema.",
        );
      }

      const caixaAberto = await trx.caixa.findFirst({
        where: { status: StatusCaixa.ABERTO },
        select: { id: true },
      });

      if (caixaAberto) {
        throw new ConflictError(
          "Feche o caixa aberto para abrir outro novamente.",
        );
      }

      const novoCaixa = await trx.caixa.create({
        data: {
          usuario_abertura_id: user_id,
          conta_id: contaPadrao.id,
          saldo_inicial: contaPadrao.saldo_atual,
          observacao_abertura: observacao?.trim() || null,
        },
      });

      return {
        ...novoCaixa,
        saldo_inicial: Number(novoCaixa.saldo_inicial),
        saldo_final_sistema:
          novoCaixa.saldo_final_sistema === null
            ? null
            : Number(novoCaixa.saldo_final_sistema),
        saldo_final_informado:
          novoCaixa.saldo_final_informado === null
            ? null
            : Number(novoCaixa.saldo_final_informado),
        diferenca:
          novoCaixa.diferenca === null ? null : Number(novoCaixa.diferenca),
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
};

const consultaFechamento = async () => {
  return prisma.$transaction(
    async (trx) => {
      const caixa = await trx.caixa.findFirst({
        where: { status: StatusCaixa.ABERTO },
      });

      if (!caixa) {
        throw new NotFound("Não foi encontrado nenhum caixa aberto!");
      }

      const movimentacoes = await trx.movimentacaoFinanceira.findMany({
        where: {
          caixa_id: caixa.id,
          conta_id: caixa.conta_id,
        },
        orderBy: { id: "asc" },
      });

      const somar = (
        filtro: (movimentacao: (typeof movimentacoes)[number]) => boolean,
      ) =>
        movimentacoes.reduce(
          (total, movimentacao) =>
            filtro(movimentacao) ? total.plus(movimentacao.valor) : total,
          decimalZero,
        );

      const compraTotal = somar(
        (movimentacao) =>
          movimentacao.origem === OrigemMovimentacao.PEDIDO_COMPRA &&
          movimentacao.direcao === DirecaoFinanceira.SAIDA,
      );
      const vendaTotal = somar(
        (movimentacao) =>
          movimentacao.origem === OrigemMovimentacao.PEDIDO_VENDA &&
          movimentacao.direcao === DirecaoFinanceira.ENTRADA,
      );
      const despesaTotal = somar(
        (movimentacao) =>
          movimentacao.origem === OrigemMovimentacao.LANCAMENTO_PAGAR &&
          movimentacao.direcao === DirecaoFinanceira.SAIDA,
      );
      const abastecimentoTotal = somar(
        (movimentacao) =>
          movimentacao.origem === OrigemMovimentacao.TRANSFERENCIA &&
          movimentacao.direcao === DirecaoFinanceira.ENTRADA,
      );
      const retiradasTotal = somar(
        (movimentacao) =>
          movimentacao.origem === OrigemMovimentacao.TRANSFERENCIA &&
          movimentacao.direcao === DirecaoFinanceira.SAIDA,
      );
      const totalCreditos = somar(
        (movimentacao) =>
          movimentacao.direcao === DirecaoFinanceira.ENTRADA,
      );
      const totalDebitos = somar(
        (movimentacao) => movimentacao.direcao === DirecaoFinanceira.SAIDA,
      );
      const valorEsperado = caixa.saldo_inicial
        .plus(totalCreditos)
        .minus(totalDebitos);

      return {
        caixa_id: caixa.id,
        valor_abertura: Number(caixa.saldo_inicial),
        data_abertura: caixa.aberto_em,
        compra_total: Number(compraTotal),
        venda_total: Number(vendaTotal),
        despesa_total: Number(despesaTotal),
        abastecimento_total: Number(abastecimentoTotal),
        retiradas_total: Number(retiradasTotal),
        total_creditos: Number(totalCreditos),
        total_debitos: Number(totalDebitos),
        valor_esperado: Number(valorEsperado),
        movimentacoes: movimentacoes.map((movimentacao) => ({
          ...movimentacao,
          saldo_inicial: Number(movimentacao.saldo_inicial),
          valor: Number(movimentacao.valor),
          saldo_final: Number(movimentacao.saldo_final),
        })),
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
  );
};

const findAll = async ({ dataFinal, dataInicial }: ConsultaCaixasInput) => {
  const caixas = await prisma.caixa.findMany({
    where: {
      aberto_em:
        dataInicial || dataFinal
          ? {
              gte: dataInicial,
              lte: dataFinal,
            }
          : undefined,
    },
    include: {
      conta: { select: { id: true, nome: true } },
      usuario_abertura: { select: { id: true, nome: true } },
      usuario_fechamento: { select: { id: true, nome: true } },
    },
    orderBy: { aberto_em: "desc" },
  });

  return caixas.map((caixa) => ({
    ...caixa,
    saldo_inicial: Number(caixa.saldo_inicial),
    saldo_final_sistema:
      caixa.saldo_final_sistema === null
        ? null
        : Number(caixa.saldo_final_sistema),
    saldo_final_informado:
      caixa.saldo_final_informado === null
        ? null
        : Number(caixa.saldo_final_informado),
    diferenca: caixa.diferenca === null ? null : Number(caixa.diferenca),
  }));
};

const getByID = async (id: number) => {
  const caixa = await prisma.caixa.findUnique({
    where: { id },
    include: {
      conta: { select: { id: true, nome: true } },
      usuario_abertura: { select: { id: true, nome: true } },
      usuario_fechamento: { select: { id: true, nome: true } },
      movimentacoes: {
        orderBy: { id: "asc" },
      },
    },
  });

  if (!caixa) {
    throw new NotFound("Caixa não encontrado.");
  }

  return {
    ...caixa,
    saldo_inicial: Number(caixa.saldo_inicial),
    saldo_final_sistema:
      caixa.saldo_final_sistema === null
        ? null
        : Number(caixa.saldo_final_sistema),
    saldo_final_informado:
      caixa.saldo_final_informado === null
        ? null
        : Number(caixa.saldo_final_informado),
    diferenca: caixa.diferenca === null ? null : Number(caixa.diferenca),
    movimentacoes: caixa.movimentacoes
      .filter((movimentacao) => movimentacao.conta_id === caixa.conta_id)
      .map((movimentacao) => ({
        ...movimentacao,
        saldo_inicial: Number(movimentacao.saldo_inicial),
        valor: Number(movimentacao.valor),
        saldo_final: Number(movimentacao.saldo_final),
      })),
  };
};

const fechar = async ({
  user_id,
  observacao,
  motivo,
  saldo_informado,
}: FechamentoCaixaInput) => {
  return prisma.$transaction(
    async (trx) => {
      const caixa = await trx.caixa.findFirst({
        where: { status: StatusCaixa.ABERTO },
      });

      if (!caixa) {
        throw new NotFound("Não foi encontrado nenhum caixa aberto!");
      }

      const pedidoAberto = await trx.pedido.findFirst({
        where: { caixaID: caixa.id, status: "ABERTO" },
        select: { id: true },
      });
      if (pedidoAberto) {
        throw new ConflictError(
          `O caixa não pode ser fechado enquanto o pedido #${pedidoAberto.id} estiver aberto.`,
        );
      }

      const totais = await trx.movimentacaoFinanceira.groupBy({
        by: ["direcao"],
        where: {
          caixa_id: caixa.id,
          conta_id: caixa.conta_id,
        },
        _sum: { valor: true },
      });

      const totalCreditos =
        totais.find(
          (total) => total.direcao === DirecaoFinanceira.ENTRADA,
        )?._sum.valor ?? decimalZero;
      const totalDebitos =
        totais.find((total) => total.direcao === DirecaoFinanceira.SAIDA)?._sum
          .valor ?? decimalZero;
      const saldoEsperado = caixa.saldo_inicial
        .plus(totalCreditos)
        .minus(totalDebitos);
      const saldoInformado = new Prisma.Decimal(saldo_informado);
      const contaAntesDoFechamento = await trx.contaFinanceira.findUnique({
        where: { id: caixa.conta_id },
      });

      if (!contaAntesDoFechamento) {
        throw new NotFound("A conta vinculada ao caixa não foi encontrada.");
      }

      if (!contaAntesDoFechamento.saldo_atual.equals(saldoEsperado)) {
        throw new ConflictError(
          "O saldo da conta padrão diverge das movimentações do caixa.",
        );
      }

      if (saldoInformado.isNegative()) {
        throw new ConflictError("O saldo informado não pode ser negativo.");
      }

      const diferenca = saldoInformado.minus(saldoEsperado);
      const temDiferenca = !diferenca.isZero();
      const motivoNormalizado = motivo?.trim();

      if (temDiferenca && !motivoNormalizado) {
        throw new ConflictError(
          "O motivo da diferença deve ser informado para fechar o caixa.",
        );
      }

      let movimentacaoCorrecao = null;

      if (temDiferenca) {
        const valorAjuste = diferenca.abs();
        const direcao = diferenca.isPositive()
          ? DirecaoFinanceira.ENTRADA
          : DirecaoFinanceira.SAIDA;
        const contaAjustada = await trx.contaFinanceira.update({
          where: { id: caixa.conta_id },
          data: {
            saldo_atual:
              direcao === DirecaoFinanceira.ENTRADA
                ? { increment: valorAjuste }
                : { decrement: valorAjuste },
          },
        });

        movimentacaoCorrecao = await trx.movimentacaoFinanceira.create({
          data: {
            conta_id: caixa.conta_id,
            origem: OrigemMovimentacao.FECHAMENTO_CAIXA,
            descricao: `Correção do fechamento do caixa #${caixa.id}`,
            direcao,
            saldo_inicial: contaAntesDoFechamento.saldo_atual,
            valor: valorAjuste,
            saldo_final: contaAjustada.saldo_atual,
            user_id,
            motivo_ajuste: motivoNormalizado,
            caixa_id: caixa.id,
          },
        });
      }

      const caixaFechado = await trx.caixa.update({
        where: {
          id: caixa.id,
          status: StatusCaixa.ABERTO,
        },
        data: {
          status: StatusCaixa.FECHADO,
          usuario_fechamento_id: user_id,
          saldo_final_sistema: saldoEsperado,
          saldo_final_informado: saldoInformado,
          diferenca,
          fechado_em: new Date(),
          observacao_fechamento: observacao?.trim() || null,
        },
      });

      return {
        ...caixaFechado,
        saldo_inicial: Number(caixaFechado.saldo_inicial),
        saldo_final_sistema: Number(caixaFechado.saldo_final_sistema),
        saldo_final_informado: Number(caixaFechado.saldo_final_informado),
        diferenca: Number(caixaFechado.diferenca),
        movimentacao_correcao: movimentacaoCorrecao
          ? {
              ...movimentacaoCorrecao,
              saldo_inicial: Number(movimentacaoCorrecao.saldo_inicial),
              valor: Number(movimentacaoCorrecao.valor),
              saldo_final: Number(movimentacaoCorrecao.saldo_final),
            }
          : null,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
};

export const fecharCaixa = fechar;

const caixaFinanceiro = {
  abrir,
  consultaFechamento,
  fechar,
  findAll,
  getByID,
};

export default caixaFinanceiro;
