import { NotFound, NotPossible, UnAuthorized } from "../error";
import { prisma } from "../libs/prisma";
import { getUserByID, userHasPermission } from "./users";

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
    // Consulta usuario de fechamento
    const userFechamento = await getUserByID(userID);
    if (!userFechamento) {
      throw new UnAuthorized("Usuário não encontrado para fechamento do caixa");
    }

    // Consulta caixa DEFINE (VALOR ABERTURA,DATA ABERTURA )
    const result = await prisma.$transaction(async (trx) => {
      const caixa = await trx.livroCaixa.findFirst({
        where: { id: caixaID },
      });
      console.log(`CAIXA ID: ${caixa?.id}`);
      if (!caixa) {
        throw new NotFound("Não foi encontrado nenhum caixa aberto!");
      }
      const valorAbertura = Number(caixa.saldoInicial.toFixed(2));
      const dataAbertura = caixa.dataAbertura;
      const valorEsperado = Number(caixa.saldoFinal.toFixed(2));

      console.log(`valor Abertura: ${valorAbertura}`);
      console.log(`data Abertura: ${dataAbertura}`);
      console.log(`valor Esperado: ${valorEsperado}`);

      // Consulta ABASTECIMENTOS

      const somaAbastecimentos = await trx.movimentacaoFinanceira.aggregate({
        _sum: { valor: true },
        where: { tipoMovimentacaoID: 2, estornadoEm: null, estornoID: null },
      });
      const totalAbastecimento =
        Number(somaAbastecimentos._sum.valor?.toFixed(2)) ?? 0;

      console.log(`ABASTECIMENTOS:  ${totalAbastecimento}`);
      // CONSULTA DESPESAS
      const somaDespesas = await trx.movimentacaoFinanceira.aggregate({
        _sum: { valor: true },
        where: { tipoMovimentacaoID: 7, estornadoEm: null, estornoID: null },
      });
      const totalDespesas =
        Number(somaDespesas._sum.valor?.abs().toFixed(2)) ?? 0;
      console.log(`DESPESAS: ${totalDespesas}`);
      // CONSULTA VALOR PAGO COMPRAS NO CAIXA
      const somaComprasCAIXA = await trx.movimentacaoFinanceira.aggregate({
        _sum: { valor: true },
        where: {
          tipoMovimentacaoID: 5,
          conta: {
            forma: "DINHEIRO",
            pedido: {
              tipo: "COMPRA",
            },
          },
        },
      });
      const totalComprasCAIXA =
        Number(somaComprasCAIXA._sum.valor?.abs().toFixed(2)) ?? 0;

      console.log(`SOMA COMPRAS DINH: ${totalComprasCAIXA}`);
      // CONSULTA VALOR COMPRA POR TRANSFERENCIA
      const somaComprasTRANSF = await trx.movimentacaoFinanceira.aggregate({
        _sum: { valor: true },
        where: {
          tipoMovimentacaoID: 5,
          conta: {
            forma: "TRANSFERENCIA",
            pedido: {
              tipo: "COMPRA",
            },
          },
        },
      });
      const totalComprasTRANSF =
        Number(somaComprasTRANSF._sum.valor?.abs().toFixed(2)) ?? 0;
      console.log(`SOMA COMPRAS TRANSF: ${totalComprasTRANSF}`);
      // CONSULTA VALOR TOTAL DE COMPRAS
      const totalCompras = await trx.movimentacaoFinanceira.aggregate({
        _sum: { valor: true },
        where: {
          tipoMovimentacaoID: 5,
          conta: {
            pedido: {
              tipo: "COMPRA",
            },
          },
        },
      });
      const valorTotalCompras =
        Number(totalCompras._sum.valor?.abs().toFixed(2)) ?? 0;
      console.log(`SOMA VALOR TOTAL COMPRAS: ${valorTotalCompras}`);
      //SOMA VALOR TOTAL DE VENDAS
      const totalVendas = await trx.movimentacaoFinanceira.aggregate({
        _sum: { valor: true },
        where: {
          tipoMovimentacaoID: 3,
          conta: {
            pedido: { tipo: "VENDA" },
          },
        },
      });
      const valorTotalVendas =
        Number(totalVendas._sum.valor?.abs().toFixed(2)) ?? 0;
      console.log(`SOMA VALOR TOTAL VENDAS: ${valorTotalVendas}`);
      // CONSULTA QUANTIDADE DE PEDIDOS DE COMPRA
      const countPedidosCompra = await trx.pedido.count({
        where: { tipo: "COMPRA", caixaID: caixa.id },
      });
      const numeroPedidosCompra = countPedidosCompra ?? 0;
      // CONSULTA QUANTIDADE DE PEDIDOS DE VENDA
      const countPedidosVenda = await trx.pedido.count({
        where: { tipo: "VENDA", caixaID: caixa.id },
      });
      const numeroPedidosVenda = countPedidosVenda ?? 0;
      console.log(`PEDIDOS DE VENDA: ${numeroPedidosVenda}`);
      console.log(`PEDIDOS DE COMPRA: ${numeroPedidosCompra}`);
      // CONSULTA QUANTIDADE DE MATERIAL (KG) COMPRADO E VALOR PAGO
      const materiaisComprados = await trx.itemPedido.groupBy({
        by: ["materialID"],
        _sum: {
          quantidade: true,
          subtotal: true,
        },
        where: {
          pedido: {
            tipo: "COMPRA",
            caixaID: caixa.id,
          },
        },
      });
      console.log(materiaisComprados);
      // CONSULTA QUANTIDADE DE MATERIAL (KG) VENDIDO E VALOR PAGO
      const materiaisVendidos = await trx.itemPedido.groupBy({
        by: ["materialID"],
        _sum: {
          quantidade: true,
          subtotal: true,
        },
        where: {
          pedido: {
            tipo: "VENDA",
            caixaID: caixa.id,
          },
        },
      });
      console.log(materiaisVendidos);

      // PESO TOTAL DE COMPRA E TOTAL DE VENDA DE ACORDO COM CONSULTA ACIMA
      const pesoTotalComprado = materiaisComprados.reduce((acc, item) => {
        return acc + (Number(item._sum.quantidade) ?? 0);
      }, 0);
      console.log(`PESO TOTAL COMPRADO: ${pesoTotalComprado} KG`);
      const pesoTotalVendido = materiaisVendidos.reduce((acc, item) => {
        return acc + (Number(item._sum.quantidade) ?? 0);
      }, 0);
      console.log(`PESO TOTAL VENDIDO: ${pesoTotalVendido} KG`);
      return {
        caixaID: caixa.id,
        valorAbertura,
        dataAbertura,
        valorEsperado,
        totalAbastecimento,
        totalDespesas,
        totalComprasCAIXA,
        totalComprasTRANSF,
        valorTotalCompras,
        valorTotalVendas,
        numeroPedidosCompra,
        numeroPedidosVenda,
        pesoTotalComprado,
        pesoTotalVendido,
        materiaisComprados,
        materiaisVendidos,
      };
    });
    return result;
  } catch (error) {}
};
export const fecharCaixa = async (userID: number) => {
  try {
    // Consulta usuario de fechamento
    const userFechamento = await getUserByID(userID);
    if (!userFechamento) {
      throw new UnAuthorized("Usuário não encontrado para fechamento do caixa");
    }

    const result = await prisma.$transaction(async (trx) => {
      const caixa = await trx.livroCaixa.findFirst({
        where: { status: "ABERTO" },
      });
      // edita Caixa
      const caixaAtualizado = await trx.livroCaixa.update({
        where: { id: caixa?.id },
        data: { status: "FECHADO", dataFechamento: new Date() },
      });
      console.log(`CAIXA ID: ${caixa?.id}`);
      if (!caixa) {
        throw new NotFound("Não foi encontrado nenhum caixa aberto!");
      }
      // verifica se não existe pedido em aberto no caixa
      const pedidosAberto = await trx.pedido.findFirst({
        where: { status: "ABERTO", caixaID: caixa.id },
      });
      if (pedidosAberto) {
        throw new NotPossible(
          "Existem pedidos em aberto no caixa. Não é possível fechar o caixa."
        );
      }
      const valorAbertura = Number(caixa.saldoInicial.toFixed(2));
      const dataAbertura = caixa.dataAbertura;
      const valorEsperado = Number(caixa.saldoFinal.toFixed(2));

      console.log(`valor Abertura: ${valorAbertura}`);
      console.log(`data Abertura: ${dataAbertura}`);
      console.log(`valor Esperado: ${valorEsperado}`);

      // Consulta ABASTECIMENTOS

      const somaAbastecimentos = await trx.movimentacaoFinanceira.aggregate({
        _sum: { valor: true },
        where: { tipoMovimentacaoID: 2, estornadoEm: null, estornoID: null },
      });
      const totalAbastecimento =
        Number(somaAbastecimentos._sum.valor?.toFixed(2)) ?? 0;

      console.log(`ABASTECIMENTOS:  ${totalAbastecimento}`);
      // CONSULTA DESPESAS
      const somaDespesas = await trx.movimentacaoFinanceira.aggregate({
        _sum: { valor: true },
        where: { tipoMovimentacaoID: 7, estornadoEm: null, estornoID: null },
      });
      const totalDespesas =
        Number(somaDespesas._sum.valor?.abs().toFixed(2)) ?? 0;
      console.log(`DESPESAS: ${totalDespesas}`);
      // CONSULTA VALOR PAGO COMPRAS NO CAIXA
      const somaComprasCAIXA = await trx.movimentacaoFinanceira.aggregate({
        _sum: { valor: true },
        where: {
          tipoMovimentacaoID: 5,
          conta: {
            forma: "DINHEIRO",
            pedido: {
              tipo: "COMPRA",
            },
          },
        },
      });
      const totalComprasCAIXA =
        Number(somaComprasCAIXA._sum.valor?.abs().toFixed(2)) ?? 0;

      console.log(`SOMA COMPRAS DINH: ${totalComprasCAIXA}`);
      // CONSULTA VALOR COMPRA POR TRANSFERENCIA
      const somaComprasTRANSF = await trx.movimentacaoFinanceira.aggregate({
        _sum: { valor: true },
        where: {
          tipoMovimentacaoID: 5,
          conta: {
            forma: "TRANSFERENCIA",
            pedido: {
              tipo: "COMPRA",
            },
          },
        },
      });
      const totalComprasTRANSF =
        Number(somaComprasTRANSF._sum.valor?.abs().toFixed(2)) ?? 0;
      console.log(`SOMA COMPRAS TRANSF: ${totalComprasTRANSF}`);
      // CONSULTA VALOR TOTAL DE COMPRAS
      const totalCompras = await trx.movimentacaoFinanceira.aggregate({
        _sum: { valor: true },
        where: {
          tipoMovimentacaoID: 5,
          conta: {
            pedido: {
              tipo: "COMPRA",
            },
          },
        },
      });
      const valorTotalCompras =
        Number(totalCompras._sum.valor?.abs().toFixed(2)) ?? 0;
      console.log(`SOMA VALOR TOTAL COMPRAS: ${valorTotalCompras}`);
      //SOMA VALOR TOTAL DE VENDAS
      const totalVendas = await trx.movimentacaoFinanceira.aggregate({
        _sum: { valor: true },
        where: {
          tipoMovimentacaoID: 3,
          conta: {
            pedido: { tipo: "VENDA" },
          },
        },
      });
      const valorTotalVendas =
        Number(totalVendas._sum.valor?.abs().toFixed(2)) ?? 0;
      console.log(`SOMA VALOR TOTAL VENDAS: ${valorTotalVendas}`);
      // CONSULTA QUANTIDADE DE PEDIDOS DE COMPRA
      const countPedidosCompra = await trx.pedido.count({
        where: { tipo: "COMPRA", caixaID: caixa.id },
      });
      const numeroPedidosCompra = countPedidosCompra ?? 0;
      // CONSULTA QUANTIDADE DE PEDIDOS DE VENDA
      const countPedidosVenda = await trx.pedido.count({
        where: { tipo: "VENDA", caixaID: caixa.id },
      });
      const numeroPedidosVenda = countPedidosVenda ?? 0;
      console.log(`PEDIDOS DE VENDA: ${numeroPedidosVenda}`);
      console.log(`PEDIDOS DE COMPRA: ${numeroPedidosCompra}`);
      // CONSULTA QUANTIDADE DE MATERIAL (KG) COMPRADO E VALOR PAGO
      const materiaisComprados = await trx.itemPedido.groupBy({
        by: ["materialID"],
        _sum: {
          quantidade: true,
          subtotal: true,
        },
        where: {
          pedido: {
            tipo: "COMPRA",
            caixaID: caixa.id,
          },
        },
      });
      console.log(materiaisComprados);
      // CONSULTA QUANTIDADE DE MATERIAL (KG) VENDIDO E VALOR PAGO
      const materiaisVendidos = await trx.itemPedido.groupBy({
        by: ["materialID"],
        _sum: {
          quantidade: true,
          subtotal: true,
        },
        where: {
          pedido: {
            tipo: "VENDA",
            caixaID: caixa.id,
          },
        },
      });
      console.log(materiaisVendidos);

      // PESO TOTAL DE COMPRA E TOTAL DE VENDA DE ACORDO COM CONSULTA ACIMA
      const pesoTotalComprado = materiaisComprados.reduce((acc, item) => {
        return acc + (Number(item._sum.quantidade) ?? 0);
      }, 0);
      console.log(`PESO TOTAL COMPRADO: ${pesoTotalComprado} KG`);
      const pesoTotalVendido = materiaisVendidos.reduce((acc, item) => {
        return acc + (Number(item._sum.quantidade) ?? 0);
      }, 0);
      console.log(`PESO TOTAL VENDIDO: ${pesoTotalVendido} KG`);
      const fechamento = await trx.fechamento.create({
        data: {
          caixaID: caixa.id,
          valor_abertura: valorAbertura,
          valor_abastecimentos: totalAbastecimento,
          valor_despesas: totalDespesas,
          data_abertura: dataAbertura,
          data_fechamento: new Date(),
          userID_fechamento: userID,
          valor_esperado: valorEsperado,
          peso_total_compras: pesoTotalComprado,
          peso_total_vendas: pesoTotalVendido,

          qnt_compras: numeroPedidosCompra,
          qnt_vendas: numeroPedidosVenda,
          valor_total_vendas: valorTotalVendas,
          valor_total_compras: valorTotalCompras,
        },
      });
      return fechamento;
    });
    return result;
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
