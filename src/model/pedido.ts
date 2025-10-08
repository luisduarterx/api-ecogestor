import {
  BadRequest,
  InternalError,
  NotFound,
  NotPossible,
  UnAuthorized,
} from "../error";
import { Prisma } from "../generated/prisma";
import { prisma } from "../libs/prisma";

import { ReqUser } from "../types/user";
import { caixaAberto } from "./caixa";
import { getMaterialByID } from "./materiais";
import { inputMovimentacao, novaMovimentacao } from "./movFinanceiro";

import { findRegisterByID, findRegisterTable } from "./registros";
import { findPriceOnTable } from "./tabela";
import { userHasPermission } from "./users";

type CreateOrderArgs = {
  userID: number;
  tipo: "COMPRA" | "VENDA";
  regID?: number;
};
type CreateItemOrderArgs = {
  user: ReqUser;
  pedID: number;
  item:
    | {
        materialID: number;
        modo: "QUANTIDADE";
        quantidade: number;
        preco?: number;
      }
    | {
        materialID: number;
        modo: "PESAGEM";
        pesagem: {
          pesoBruto: number;
          tara: number;
          impureza: number;
        };
        preco?: number;
      };
};
type DeleteItemOrderArgs = {
  pedidoID: number;
  itemID: number;
};
type CloseOrderArgs = {
  userID: number;
  pedID: number;
  pagamento: {
    metodo: "DINHEIRO" | "TRANSFERENCIA" | "ABATER";
    valor: number;
  }[];
  baixarAgora: boolean;
};

//itens

export const findOrderByID = async (id: number) => {
  try {
    const pedido = prisma.pedido.findUnique({
      where: { id },
      include: {
        items: {
          select: {
            materialID: true,
            quantidade: true,
            preco: true,
            subtotal: true,
          },
        },
      },
    });
    if (!pedido) {
      throw new NotPossible("Pedido Inexistente!");
    }

    return pedido;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const removeItemOrder = async (it: DeleteItemOrderArgs) => {
  try {
    // verifica se o pedido esta aberto

    const pedido = await findOrderByID(it.pedidoID);
    if (!pedido) {
      throw new NotFound("Pedido não encontrado!");
    }
    if (pedido.status !== "ABERTO") {
      throw new NotPossible(`Esse pedido esta ${pedido.status}`);
    }

    const result = prisma.$transaction(async (trx) => {
      try {
        const item = await trx.itemPedido.delete({ where: { id: it.itemID } });
        const pedidoAlterado = trx.pedido.update({
          where: { id: it.pedidoID },
          data: {
            valor_total: { decrement: item.subtotal },
          },
          include: {
            items: {
              select: {
                materialID: true,
                quantidade: true,
                preco: true,
                subtotal: true,
              },
            },
          },
        });
        return pedidoAlterado;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2025") {
            throw new NotPossible(
              "O Item escolhido ja foi deletado ou não existe!"
            );
          }
        }
        throw error;
      }
    });
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const addNewItemOrder = async (it: CreateItemOrderArgs) => {
  try {
    // verifica se user tem permissao para alterar preco
    const userHasEditPrice = await userHasPermission(
      it.user.id,
      "edit:PriceOnOrder"
    );

    // verifica se o pedido esta aberto

    const pedido = await findOrderByID(it.pedID);
    if (!pedido) {
      throw new NotFound("Pedido não encontrado!");
    }
    if (pedido.status !== "ABERTO") {
      throw new NotPossible(`Esse pedido esta ${pedido.status}`);
    }
    const material = await getMaterialByID(it.item.materialID);

    if (!material || material.status === false) {
      throw new BadRequest("Não foi possivel encontrar o material informado.");
    }
    const tabelaID = pedido.regID
      ? await findRegisterTable(pedido.regID)
      : Number(process.env.TABELA_PADRAO as string);
    //define preco
    let preco: number;
    let subtotal: number;
    const pesoBruto =
      it.item.modo === "PESAGEM" ? it.item.pesagem.pesoBruto : 0;
    const tara = it.item.modo === "PESAGEM" ? it.item.pesagem.tara : 0;
    const impureza = it.item.modo === "PESAGEM" ? it.item.pesagem.impureza : 0;
    const pesoLiquido =
      it.item.modo === "PESAGEM" ? pesoBruto - tara : it.item.quantidade;

    if (pesoLiquido < impureza) {
      throw new BadRequest("A Impureza é maior que o peso liquido");
    }
    const quantidade = pesoLiquido - impureza;

    // calcula o subtotal

    if (it.item.preco) {
      if (userHasEditPrice) {
        preco = it.item.preco;

        subtotal = Number((quantidade * preco).toFixed(2));
      } else {
        throw new UnAuthorized(
          "O usuário informado nao possui a permissao 'edit:PriceOnOrder'"
        );
      }
    } else {
      preco =
        pedido.tipo === "VENDA"
          ? Number(material.v_venda)
          : Number(
              (await findPriceOnTable(it.item.materialID, tabelaID)) ||
                (await findPriceOnTable(
                  it.item.materialID,
                  Number(process.env.TABELA_PADRAO as string)
                ))
            );

      subtotal = Number((quantidade * preco).toFixed(2));
    }

    console.log(subtotal);

    const result = await prisma.$transaction(async (trx) => {
      try {
        // insere pedido
        const itemPedido = await trx.itemPedido.create(
          {
            data: {
              pedidoID: pedido.id,
              materialID: it.item.materialID,
              preco,
              quantidade,
              impureza,
              tara,
              pesoBruto,
              subtotal,
            },
          }

          // insere movimentacao de material
        );

        // const movimentacao = await trx.movimentacaoEstoque.create({
        //   data: {
        //     materialID: itemPedido.materialID,
        //     tipoMovimentacao: pedido.tipo === "COMPRA" ? "ENTRADA" : "SAIDA",
        //     origem: "PEDIDO",
        //     origemID: pedido.id,
        //     quantidade: itemPedido.quantidade,
        //   },
        // });

        const pedidoAlterado = await trx.pedido.update({
          where: { id: pedido.id },
          data: {
            valor_total: { increment: itemPedido.subtotal },
          },
          include: {
            items: {
              select: {
                materialID: true,
                quantidade: true,
                preco: true,
                subtotal: true,
              },
            },
          },
        });
        return pedidoAlterado;
      } catch (error) {
        console.log(error);
        throw error;
      }
    });
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const vincularRegistro = async (pedID: number, regID: number) => {
  try {
    const pedido = await prisma.pedido.update({
      where: { id: pedID },
      data: { regID: regID === 0 ? null : regID },
      select: {
        id: true,
        regID: true,
        status: true,
        atualizado: true,
      },
    });

    return pedido;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
// pedido

export const createNewOrder = async ({
  userID,
  tipo,
  regID,
}: CreateOrderArgs) => {
  try {
    const caixaID = await caixaAberto();

    if (!caixaID) {
      throw new NotPossible("Primeiro você deve abrir um caixa!");
    }

    const registro = regID ? await findRegisterByID(regID) : undefined;

    const pedido = await prisma.pedido.create({
      data: {
        caixaID: caixaID,
        regID,
        tipo,
        userID,
      },
    });

    if (!pedido) {
      throw new InternalError();
    }
    return pedido;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const closeOrder = async (data: CloseOrderArgs) => {
  try {
    // verifica se caixa esta aberto
    const caixa = await caixaAberto();
    if (!caixa) {
      throw new NotPossible("Primeiro você deve abrir um caixa!");
    }
    // verificar se é obrigatorio ter um Registro atribuido

    // pego pedido
    const pedido = await findOrderByID(data.pedID);

    // verifica se pedido esta aberto
    if (!pedido || pedido.status === "FECHADO") {
      throw new NotPossible(
        "Esse pedido não existe ou já foi fechado anteriormente."
      );
    }
    // verificar se os pagamentos equivalem ao valor total do pedido
    let valorTotal: number = 0;
    for (const pg of data.pagamento) {
      valorTotal += pg.valor;
    }
    if (valorTotal !== Number(pedido?.valor_total)) {
      throw new BadRequest(
        "A soma dos pagamentos deve ser igual ao valor total do pedido"
      );
    }

    const result = await prisma.$transaction(async (trx) => {
      try {
        // criar movimentacoes de estoque de cada item do pedido
        for (const item of pedido.items) {
          const movimentacao = await trx.movimentacaoEstoque.create({
            data: {
              materialID: item.materialID,
              tipoMovimentacao: pedido.tipo === "COMPRA" ? "ENTRADA" : "SAIDA",
              origem: "PEDIDO",
              origemID: pedido.id,
              quantidade: item.quantidade,
            },
          });

          await trx.material.update({
            where: { id: item.materialID },
            data: {
              estoque:
                movimentacao.tipoMovimentacao === "ENTRADA"
                  ? { increment: item.quantidade }
                  : { decrement: item.quantidade },
            },
          });
        }

        const TemABATER = data.pagamento.some((pg) => {
          return pg.metodo === "ABATER";
        });

        if (TemABATER && !pedido.regID) {
          throw new NotPossible(
            "Não é possivel utilizar 'ABATER' sem um registro definido"
          );
        }
        // criar movimentacoes de financeira de cada item do pedido
        for (const pg of data.pagamento) {
          const pagamento = await trx.contaFinanceira.create({
            data: {
              tipo: pedido.tipo === "COMPRA" ? "PAGAR" : "RECEBER",
              pedidoID: pedido.id,
              registroID: pedido.regID,
              valor: pg.valor,
              data_documento: new Date(), //desnecessario
              forma: pg.metodo,
            },
          });

          if (data.baixarAgora) {
            //cria movimentacao financeira
            const findCaixa = await trx.livroCaixa.findFirst({
              where: { id: caixa, status: "ABERTO" },
            });
            if (!findCaixa) {
              throw new NotPossible(
                "Não é possivel criar um movimento em um caixa fechado ou inexistente!"
              );
            }
            const saldoFinal =
              pg.metodo === "DINHEIRO"
                ? pedido.tipo === "COMPRA"
                  ? Number(findCaixa.saldoFinal) - pg.valor
                  : Number(findCaixa.saldoFinal) + pg.valor
                : Number(findCaixa.saldoFinal);

            const movimentacao = await trx.movimentacaoFinanceira.create({
              data: {
                bancoID: pg.metodo === "TRANSFERENCIA" ? 1 : undefined,
                caixaID: caixa,
                contaID: pagamento.id,
                tipoMovimentacaoID:
                  pg.metodo === "ABATER"
                    ? pedido.tipo === "COMPRA"
                      ? 4
                      : 6
                    : pedido.tipo === "COMPRA"
                    ? 5
                    : 3,
                data: new Date(),
                saldoInicial: findCaixa?.saldoFinal,
                valor: pedido.tipo === "COMPRA" ? -pg.valor : pg.valor,
                saldoFinal,
                userID: data.userID,
              },
              include: {
                tipoMovimentacao: {
                  select: {
                    tipo: true,
                  },
                },
              },
            });
            // alterar valores nos devidos caixa/banco
            const direcao = movimentacao.tipoMovimentacao.tipo;
            if (pg.metodo === "DINHEIRO") {
              await trx.livroCaixa.update({
                where: { id: caixa, status: "ABERTO" },
                data: {
                  saldoFinal:
                    direcao === "ENTRADA"
                      ? { increment: Math.abs(Number(movimentacao.valor)) }
                      : { decrement: Math.abs(Number(movimentacao.valor)) },
                },
              });
            } else if (pg.metodo === "TRANSFERENCIA") {
              await trx.banco.update({
                where: { id: movimentacao.bancoID as number },
                data: {
                  saldo:
                    direcao === "ENTRADA"
                      ? { increment: Math.abs(Number(movimentacao.valor)) }
                      : { decrement: Math.abs(Number(movimentacao.valor)) },
                },
              });
            } else if (pg.metodo === "ABATER") {
              await trx.saldoFinanceiro.update({
                where: { regID: pedido.regID as number },
                data: {
                  saldo:
                    direcao === "ENTRADA"
                      ? { increment: Math.abs(Number(movimentacao.valor)) }
                      : { decrement: Math.abs(Number(movimentacao.valor)) },
                },
              });
            }
            // edita conta com data pagamento
            const contaAtualizada = await trx.contaFinanceira.update({
              where: { id: pagamento.id },
              data: {
                data_pagamento: new Date(),
              },
            });
          }
          const pedidoAlterado = await trx.pedido.update({
            where: { id: pedido.id },
            data: { status: "FECHADO" },
          });
        }

        return await findOrderByID(data.pedID);
      } catch (error) {
        console.log(error);
        throw error;
      }
    });
    return result;
    //verificar direcao da movimentacao financeira

    // verificar forma de pagamento
    // criar conta a pagar/receber ?
    // criar movimentacao caixa/banco ?

    // criar movimentacao no saldoRegistro?
  } catch (error) {
    console.log(error);
    throw error;
  }
};
