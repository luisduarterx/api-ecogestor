import { NotPossible } from "../error";
import { prisma } from "../libs/prisma";
import { getUserByID } from "./users";

export const abrirCaixa = async (userID: number, valor: number) => {
  try {
    const caixaAberto = await prisma.livroCaixa.findMany({
      where: { status: "ABERTO" },
    });
    console.log(caixaAberto);
    if (caixaAberto.length > 0) {
      throw new NotPossible(
        "É necessário fechar o caixa anterior para abrir um novo caixa."
      );
    }

    const result = await prisma.$transaction(async (trx) => {
      const caixa = await trx.livroCaixa.create({
        data: {
          abertoPorID: userID,
          saldoInicial: valor,
          saldoFinal: valor,
        },
      });
      const movimentacao = await trx.movimentacaoFinanceira.create({
        data: {
          descricao: "ABERTURA",
          userID: userID,
          tipoMovimentacaoID: 1,
          valor: caixa.saldoInicial,
          caixaID: caixa.id,
          saldoInicial: 0,
          saldoFinal: caixa.saldoFinal,
        },
      });

      return {
        id: caixa.id,
        abertoPor: caixa.abertoPorID,
        data: caixa.dataAbertura,
        saldoInicial: caixa.saldoInicial,
      };
    });

    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const consultaFechamento = async (caixaID: number, userID: number) => {
  try {
    //Consulta usuario de fechamento
    const userFechamento = await getUserByID(userID);
    // Consulta caixa DEFINE (VALOR ABERTURA,DATA ABERTURA )
    const caixa = await prisma.livroCaixa.findFirst({
      where: {
        id: caixaID,
      },
      include: {
        abertoPor: { select: { id: true, nome: true } },
      },
    });

    if (!caixa) {
      throw new NotPossible("Não há nenhum caixa aberto!");
    }
    const dataAbertura = caixa.dataAbertura;
    // Consulta ABASTECIMENTOS
    const abastecimentos = await prisma.movimentacaoFinanceira.aggregate({
      _sum: {
        valor: true,
      },
      where: { tipoMovimentacaoID: 2 },
    });
    // CONSULTA DESPESAS
    const despesas = await prisma.movimentacaoFinanceira.aggregate({
      _sum: {
        valor: true,
      },
      where: {
        tipoMovimentacaoID: 7,
      },
    });
    // CONSULTA VALOR PAGO COMPRAS
    const compras = await prisma.movimentacaoFinanceira.aggregate({
      _sum: {
        valor: true,
      },
      where: {
        tipoMovimentacaoID: 5,
      },
    });
    // CONSULTA VALOR RECEBIDO VENDAS
    const vendas = await prisma.movimentacaoFinanceira.aggregate({
      _sum: {
        valor: true,
      },
      where: {
        tipoMovimentacaoID: 3,
      },
    });
    // CONSULTA MATERIAIS COMPRADOS KG/ VALOR PAGO
    // CONSULTA MATERIAIS VENDIDOS KG/ VALOR RECEBIDO
    // PESO TOTAL DE COMPRA E TOTAL DE VENDA DE ACORDO COM CONSULTA ACIMA
    // VALOR ESPERADO NO CAIXA CONFORME MOVIMENTACOES
    const valorEsperado = caixa.saldoFinal;

    return {
      caixaID: caixa.id,
      dataAbertura: dataAbertura,
      valorAbertura: Number(caixa.saldoInicial),
      valorAbastecimentos: Number(abastecimentos._sum.valor) || 0,
      valorDespesas: Number(despesas._sum.valor) || 0,
      abertoPor: caixa.abertoPor.nome,
      valorFechamento: Number(valorEsperado),
      status: caixa.status ? "ABERTO" : "FECHADO",
    };
  } catch (error) {}
};
export const fecharCaixa = async (userID: number) => {
  try {
    //Consulta usuario de fechamento
    // Consulta caixa DEFINE (VALOR ABERTURA,DATA ABERTURA )
    // Consulta ABASTECIMENTOS
    // CONSULTA DESPESAS
    // CONSULTA VALOR PAGO COMPRAS
    // CONSULTA VALOR RECEBIDO VENDAS
    // CONSULTA MATERIAIS COMPRADOS KG/ VALOR PAGO
    // CONSULTA MATERIAIS VENDIDOS KG/ VALOR RECEBIDO
    // PESO TOTAL DE COMPRA E TOTAL DE VENDA DE ACORDO COM CONSULTA ACIMA
    // VALOR ESPERADO NO CAIXA CONFORME MOVIMENTACOES
  } catch (error) {
    console.log(error);
    return error;
  }
};
export const caixaAberto = async () => {
  try {
    const caixa = await prisma.livroCaixa.findFirst({
      where: { status: "ABERTO" },
    });

    return caixa ? caixa.id : false;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
