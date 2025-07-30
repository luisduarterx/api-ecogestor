import { BadRequest, InternalError, NotPossible } from "../error";
import { Prisma, TipoMovimentacao } from "../generated/prisma";
import { prisma } from "../libs/prisma";

type inputMovimentacao = {
  bancoID?: number;
  caixaID: number;
  contaID?: number;
  categoriaID: number;
  tipoMovimentacao: "ENTRADA" | "SAIDA";
  valor: number;
  descricao?: string;
};
type inputEstorno = {
  id: number;
  motivo: string;
};

export const novaMovimentacao = async (data: inputMovimentacao) => {
  try {
    const caixa = await prisma.livroCaixa.findFirst({
      where: { id: data.caixaID, status: "ABERTO" },
    });

    if (!caixa) {
      throw new NotPossible(
        "Verifique se o caixa desejado é valido ou esta aberto."
      );
    }

    const banco = data.bancoID
      ? await prisma.banco.findFirst({ where: { id: data.bancoID } })
      : undefined;

    if (data.bancoID && !banco) {
      throw new BadRequest(
        "Não é possivel realizar uma movimentacao em um banco inexistente."
      );
    }
    const valor =
      data.tipoMovimentacao === "ENTRADA" ? data.valor : -data.valor;

    const result = await prisma.$transaction(async (trx) => {
      const movimento = await trx.movimentacaoFinanceira.create({
        data: {
          bancoID: data.bancoID,
          caixaID: caixa.id,
          categoriaID: data.categoriaID,
          saldoAtual: caixa.saldoFinal,
          valor: valor,
          tipoMovimentacao: data.tipoMovimentacao,
          saldoFinal: banco
            ? caixa.saldoFinal
            : Number(caixa.saldoFinal) + valor,
        },
      });

      if (banco) {
        await trx.banco.update({
          where: { id: banco.id },
          data: {
            saldo: Number(banco.saldo) + valor,
          },
        });
      } else {
        await trx.livroCaixa.update({
          where: { id: caixa.id },
          data: {
            saldoFinal: Number(caixa.saldoFinal) + valor,
          },
        });
      }
      return movimento;
    });
    return result;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        throw new BadRequest(`Não conseguimos encontrar o ID enviado`);
      }
    }
    console.log(error);
    throw error;
  }
};

export const estornarMovimentacao = async (data: inputEstorno) => {
  try {
    const movimentacao = await prisma.movimentacaoFinanceira.findFirst({
      where: {
        id: data.id,
        OR: [{ tipoMovimentacao: "ENTRADA" }, { tipoMovimentacao: "SAIDA" }],
      },
    });
    if (!movimentacao) {
      throw new NotPossible("Não conseguimos encontrar essa movimentacão.");
    }

    if (movimentacao.estornadoEm) {
      throw new NotPossible("Essa movimentação já foi estornada.");
    }

    const banco = movimentacao.bancoID
      ? await prisma.banco.findFirst({ where: { id: movimentacao.bancoID } })
      : undefined;

    const caixa = await prisma.livroCaixa.findUnique({
      where: { id: movimentacao.caixaID },
    });
    if (!caixa) {
      throw new InternalError();
    }
    if (caixa.status === "FECHADO") {
      throw new NotPossible(
        "Para alterar uma movimentacao de um caixa anterior, primeiro deverá reabrir-lo."
      );
    }

    const result = await prisma.$transaction(async (trx) => {
      const saldoOrigem = banco
        ? Number(banco.saldo)
        : Number(caixa.saldoFinal);
      const estorno = await prisma.movimentacaoFinanceira.create({
        data: {
          tipoMovimentacao: "ESTORNO",
          caixaID: movimentacao.caixaID,
          bancoID: movimentacao.bancoID,
          categoriaID: movimentacao.categoriaID,
          contaID: movimentacao.contaID,
          saldoAtual: banco ? banco.saldo : caixa.saldoFinal,
          descricao: data.motivo,
          valor: -Number(movimentacao.valor),

          saldoFinal:
            movimentacao.tipoMovimentacao === "ENTRADA"
              ? saldoOrigem - Number(movimentacao.valor)
              : saldoOrigem + Math.abs(Number(movimentacao.valor)),
        },
      });
      if (banco) {
        await trx.banco.update({
          where: { id: banco.id },
          data: {
            saldo:
              movimentacao.tipoMovimentacao === "ENTRADA"
                ? Number(banco.saldo) - Number(movimentacao.valor)
                : Number(banco.saldo) + Math.abs(Number(movimentacao.valor)),
          },
        });
      } else {
        await trx.livroCaixa.update({
          where: { id: caixa.id },
          data: {
            saldoFinal: estorno.saldoFinal,
          },
        });
      }

      await trx.movimentacaoFinanceira.update({
        where: { id: movimentacao.id },
        data: {
          estornadoEm: new Date(),
        },
      });

      //NECESSÁRIO IMPLEMENTAR REGISTRO DE LOG
      //
      //
      //
      //
      return estorno;
    });
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
