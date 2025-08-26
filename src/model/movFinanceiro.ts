import { BadRequest, InternalError, NotPossible } from "../error";
import { Prisma } from "../generated/prisma";
import { prisma } from "../libs/prisma";
import { findRegisterByID } from "./registros";

export type inputMovimentacao = {
  bancoID?: number;
  caixaID: number;
  contaID?: number;
  categoriaID?: number;
  tipoMovimentacaoID: number;
  valor: number;
  descricao?: string;
  userID: number;
  regID?: number;
};
type inputEstorno = {
  id: number;
  motivo: string;
  userID: number;
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
    if (data.tipoMovimentacaoID === 1) {
      throw new BadRequest(
        "O abastecimento ja foi registrado na abertura de caixa."
      );
    }
    //consultar o tipo de movimentacao
    const tipoMovimentacao = await prisma.caixa_TipoMovimentacao.findUnique({
      where: { id: data.tipoMovimentacaoID },
    });
    if (!tipoMovimentacao) {
      throw new InternalError();
    }
    // define a direcao financeira
    const direcao = tipoMovimentacao?.tipo;
    const valor = direcao === "ENTRADA" ? data.valor : -data.valor;

    const result = await prisma.$transaction(async (trx) => {
      const movimento = await trx.movimentacaoFinanceira.create({
        data: {
          descricao: data.descricao,
          userID: data.userID,
          contaID: data.contaID,
          bancoID: data.bancoID,
          caixaID: caixa.id,
          categoriaID: data.categoriaID,
          saldoInicial: caixa.saldoFinal,
          valor: valor,
          tipoMovimentacaoID: data.tipoMovimentacaoID,
          saldoFinal: banco
            ? caixa.saldoFinal
            : Number(caixa.saldoFinal) + valor,
        },
      });
      if (
        tipoMovimentacao.nome === "RECEBER" ||
        tipoMovimentacao.nome === "PAGAR"
      ) {
        //verifica se tem registro e existe ??
        if (!data.regID || !(await findRegisterByID(data.regID))) {
          throw new NotPossible(
            "Não é possivel utilizar o saldo de um Registro que não existe"
          );
        }

        const atualizaSaldoRegistro = await trx.saldoFinanceiro.update({
          where: {
            regID: data.regID,
          },
          data: {
            saldo:
              direcao === "ENTRADA"
                ? {
                    increment: Number(data.valor),
                  }
                : {
                    decrement: Number(data.valor),
                  },
          },
        });
      }

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
// parei aqui nas asteracoes feitas em tipomovimentacao
export const estornarMovimentacao = async (data: inputEstorno) => {
  try {
    const movimentacao = await prisma.movimentacaoFinanceira.findFirst({
      where: {
        id: data.id,
      },
      include: {
        tipoMovimentacao: {
          select: {
            tipo: true,
          },
        },
      },
    });
    if (!movimentacao) {
      throw new NotPossible("Não conseguimos encontrar essa movimentacão.");
    }
    if (movimentacao.tipoMovimentacaoID === 1) {
      throw new NotPossible(
        "Não é possivel alterar o valor de abertura, entre em contato com seu gerente."
      );
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
          estornoID: movimentacao.id,
          userID: data.userID,
          tipoMovimentacaoID: movimentacao.tipoMovimentacaoID,
          caixaID: movimentacao.caixaID,
          bancoID: movimentacao.bancoID,
          categoriaID: movimentacao.categoriaID,
          contaID: movimentacao.contaID,
          saldoInicial: banco ? banco.saldo : caixa.saldoFinal,
          descricao: data.motivo,
          valor: -Number(movimentacao.valor),

          saldoFinal:
            movimentacao.tipoMovimentacao.tipo === "ENTRADA"
              ? saldoOrigem - Number(movimentacao.valor)
              : saldoOrigem + Math.abs(Number(movimentacao.valor)),
        },
      });
      if (banco) {
        await trx.banco.update({
          where: { id: banco.id },
          data: {
            saldo:
              movimentacao.tipoMovimentacao.tipo === "ENTRADA"
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
