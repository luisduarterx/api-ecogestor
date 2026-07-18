import { no } from "zod/v4/locales";
import { Prisma } from "../../generated/prisma/client";
import {
  DirecaoFinanceira,
  OrigemMovimentacao,
  StatusCaixa,
} from "../../generated/prisma/enums";
import {
  ConflictError,
  InternalError,
  NotFound,
  NotPossible,
  UnAuthorized,
} from "../error";
import { prisma } from "../libs/prisma";

type CaixaInput = {
  observacao?: string;
  user_id: number;
};
type FechamentoCaixaInput = {
  user_id: number;
  observacao?: string;
  saldo_informado: number;
};
const abrir = async ({ user_id, observacao }: CaixaInput) => {
  try {
    const contaPadrao = await prisma.contaFinanceira.findFirst({
      where: {
        conta_padrao: true,
      },
    });
    if (!contaPadrao?.id) {
      throw new ConflictError(
        "O sistema não tem uma conta padrão definida.",
        "Defina uma conta padrão nos parametros do sistema.",
      );
    }
    const caixaAberto = await prisma.caixa.findFirst({
      where: {
        status: StatusCaixa.ABERTO,
      },
    });

    if (caixaAberto?.id) {
      throw new ConflictError(
        "Feche o caixa aberto para abrir outro novamente.",
      );
    }
    const novoCaixa = await prisma.caixa.create({
      data: {
        usuario_abertura_id: user_id,
        conta_id: contaPadrao.id,
        saldo_inicial: contaPadrao.saldo_atual,
        observacao_abertura: observacao ?? "",
      },
    });

    return { ...novoCaixa, saldo_inicial: Number(novoCaixa.saldo_inicial) };
  } catch (error) {
    throw error;
  }
};
const consultaFechamento = async () => {
  try {
    // Consulta caixa DEFINE (VALOR ABERTURA,DATA ABERTURA )
    return await prisma.$transaction(async (trx) => {
      const caixa = await trx.caixa.findFirst({
        where: {
          status: StatusCaixa.ABERTO,
        },
      });

      if (!caixa) {
        throw new NotFound("Não foi encontrado nenhum caixa aberto!");
      }

      const data_abertura = caixa.aberto_em;
      const compra_total = await trx.movimentacaoFinanceira.aggregate({
        where: {
          origem: OrigemMovimentacao.PEDIDO_COMPRA,
          direcao: DirecaoFinanceira.SAIDA,
          caixa_id: caixa.id,
          conta_id: caixa.conta_id,
        },
        _sum: {
          valor: true,
        },
      });

      const venda_total = await trx.movimentacaoFinanceira.aggregate({
        where: {
          origem: OrigemMovimentacao.PEDIDO_VENDA,
          direcao: DirecaoFinanceira.ENTRADA,
          caixa_id: caixa.id,
          conta_id: caixa.conta_id,
        },
        _sum: {
          valor: true,
        },
      });

      const despesa_total = await trx.movimentacaoFinanceira.aggregate({
        where: {
          origem: OrigemMovimentacao.LANCAMENTO_PAGAR,
          direcao: DirecaoFinanceira.SAIDA,
          caixa_id: caixa.id,
          conta_id: caixa.conta_id,
        },
        _sum: {
          valor: true,
        },
      });

      const abastecimento_total = await trx.movimentacaoFinanceira.aggregate({
        where: {
          origem: OrigemMovimentacao.TRANSFERENCIA,
          direcao: DirecaoFinanceira.ENTRADA,
          caixa_id: caixa.id,
          conta_id: caixa.conta_id,
        },
        _sum: {
          valor: true,
        },
      });

      const retiradas_total = await trx.movimentacaoFinanceira.aggregate({
        where: {
          origem: OrigemMovimentacao.TRANSFERENCIA,
          direcao: DirecaoFinanceira.SAIDA,
          caixa_id: caixa.id,
          conta_id: caixa.conta_id,
        },
        _sum: {
          valor: true,
        },
      });

      const credito_total = await trx.movimentacaoFinanceira.aggregate({
        where: {
          direcao: "ENTRADA",
          caixa_id: caixa.id,
          conta_id: caixa.conta_id,
        },
        _sum: {
          valor: true,
        },
      });

      const debito_total = await trx.movimentacaoFinanceira.aggregate({
        where: {
          direcao: "SAIDA",
          caixa_id: caixa.id,
          conta_id: caixa.conta_id,
        },
        _sum: {
          valor: true,
        },
      });

      const valor_abertura = new Prisma.Decimal(caixa.saldo_inicial);

      const total_creditos = credito_total._sum.valor ?? new Prisma.Decimal(0);

      const total_debitos = debito_total._sum.valor ?? new Prisma.Decimal(0);

      const valor_esperado = valor_abertura
        .plus(total_creditos)
        .minus(total_debitos);
      const movimentacoes = await trx.movimentacaoFinanceira.findMany({
        where: {
          caixa_id: caixa.id,
          conta_id: caixa.conta_id,
        },
      });

      return {
        caixa_id: caixa.id,
        valor_abertura: Number(valor_abertura),
        data_abertura,
        compra_total: Number(compra_total._sum.valor) ?? 0,
        venda_total: Number(venda_total._sum.valor) ?? 0,
        despesa_total: Number(despesa_total._sum.valor) ?? 0,
        abastecimento_total: Number(abastecimento_total._sum.valor) ?? 0,
        retiradas_total: Number(retiradas_total._sum.valor) ?? 0,
        total_creditos: Number(total_creditos),
        total_debitos: Number(total_debitos),
        valor_esperado: Number(valor_esperado),
        movimentacoes,
      };
    });
  } catch (error) {
    throw error;
  }
};
const findAll = async ({
  dataFinal,
  dataInicial,
}: {
  dataFinal: string;
  dataInicial: string;
}) => {};

export const fecharCaixa = async ({
  user_id,
  observacao,
  saldo_informado,
}: FechamentoCaixaInput) => {};

const caixaFinanceiro = {
  abrir,
  consultaFechamento,
  fecharCaixa,
};

export default caixaFinanceiro;
