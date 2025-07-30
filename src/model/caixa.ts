import { NotPossible } from "../error";
import { prisma } from "../libs/prisma";

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
          categoriaID: -3,
          tipoMovimentacao: "ENTRADA",
          valor: caixa.saldoInicial,
          caixaID: caixa.id,
          saldoAtual: 0,
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
export const fecharCaixa = async (userID: number) => {};
