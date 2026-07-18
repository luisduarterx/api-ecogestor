import {
  DirecaoFinanceira,
  OrigemMovimentacao,
  Prisma,
  StatusLancamento,
  TipoLancamento,
  TipoPedido,
  TipoStatusPedido,
} from "../../generated/prisma/client";
import { ConflictError, NotFound } from "../error";
import { prisma } from "../libs/prisma";
import categoriaLancamento from "./categoriaLancamento";

type ItemInput = {
  materialID: number;
  pesoBruto: string;
  tara: string;
  impureza: string;
  preco: string;
};

type TituloFinalizacao = {
  valor: string;
  vencimento: Date;
  categoria_id: number;
  titulo: string;
  descricao: string;
  baixar_agora: boolean;
  conta_id?: number;
};

type FiltrosPedido = {
  status?: TipoStatusPedido;
  tipo?: TipoPedido;
  regID?: number;
  caixaID?: number;
};

const serializarItem = <
  T extends {
    preco: Prisma.Decimal;
    quantidade: Prisma.Decimal;
    pesoBruto: Prisma.Decimal;
    tara: Prisma.Decimal;
    impureza: Prisma.Decimal;
    subtotal: Prisma.Decimal;
  },
>(
  item: T,
) => ({
  ...item,
  preco: item.preco.toNumber(),
  quantidade: item.quantidade.toNumber(),
  pesoBruto: item.pesoBruto.toNumber(),
  tara: item.tara.toNumber(),
  impureza: item.impureza.toNumber(),
  subtotal: item.subtotal.toNumber(),
});

const serializarMovimentacaoEstoque = <
  T extends {
    quantidade: Prisma.Decimal;
  },
>(
  movimentacao: T,
) => ({
  ...movimentacao,
  quantidade: movimentacao.quantidade.toNumber(),
});

const serializarMovimentacaoFinanceira = <
  T extends {
    saldo_inicial: Prisma.Decimal;
    valor: Prisma.Decimal;
    saldo_final: Prisma.Decimal;
  },
>(
  movimentacao: T,
) => ({
  ...movimentacao,
  saldo_inicial: movimentacao.saldo_inicial.toNumber(),
  valor: movimentacao.valor.toNumber(),
  saldo_final: movimentacao.saldo_final.toNumber(),
});

const serializarLancamento = <
  T extends {
    valor: Prisma.Decimal;
    desconto: Prisma.Decimal;
    acrescimo: Prisma.Decimal;
    movimentacoes?: Array<{
      saldo_inicial: Prisma.Decimal;
      valor: Prisma.Decimal;
      saldo_final: Prisma.Decimal;
    }>;
  },
>(
  lancamento: T,
) => ({
  ...lancamento,
  valor: lancamento.valor.toNumber(),
  desconto: lancamento.desconto.toNumber(),
  acrescimo: lancamento.acrescimo.toNumber(),
  ...(lancamento.movimentacoes
    ? {
        movimentacoes: lancamento.movimentacoes.map(
          serializarMovimentacaoFinanceira,
        ),
      }
    : {}),
});

const serializarPedido = <
  T extends {
    valor_total: Prisma.Decimal;
    items?: Array<{
      preco: Prisma.Decimal;
      quantidade: Prisma.Decimal;
      pesoBruto: Prisma.Decimal;
      tara: Prisma.Decimal;
      impureza: Prisma.Decimal;
      subtotal: Prisma.Decimal;
    }>;
    lancamentos?: Array<{
      valor: Prisma.Decimal;
      desconto: Prisma.Decimal;
      acrescimo: Prisma.Decimal;
      movimentacoes?: Array<{
        saldo_inicial: Prisma.Decimal;
        valor: Prisma.Decimal;
        saldo_final: Prisma.Decimal;
      }>;
    }>;
    movimentacoes?: Array<{ quantidade: Prisma.Decimal }>;
  },
>(
  pedido: T,
) => ({
  ...pedido,
  valor_total: pedido.valor_total.toNumber(),
  ...(pedido.items ? { items: pedido.items.map(serializarItem) } : {}),
  ...(pedido.lancamentos
    ? { lancamentos: pedido.lancamentos.map(serializarLancamento) }
    : {}),
  ...(pedido.movimentacoes
    ? {
        movimentacoes: pedido.movimentacoes.map(serializarMovimentacaoEstoque),
      }
    : {}),
});

const calcularItem = (input: ItemInput) => {
  const pesoBruto = new Prisma.Decimal(input.pesoBruto);
  const tara = new Prisma.Decimal(input.tara);
  const impureza = new Prisma.Decimal(input.impureza);
  const preco = new Prisma.Decimal(input.preco);

  if (pesoBruto.lessThanOrEqualTo(0)) {
    throw new ConflictError("O peso bruto deve ser maior que zero.");
  }
  if (tara.isNegative() || tara.greaterThanOrEqualTo(pesoBruto)) {
    throw new ConflictError("A tara deve ser menor que o peso bruto.");
  }
  if (impureza.isNegative() || impureza.greaterThanOrEqualTo(100)) {
    throw new ConflictError(
      "O percentual de impureza deve estar entre zero e 100.",
    );
  }
  if (preco.lessThanOrEqualTo(0)) {
    throw new ConflictError("O preço deve ser maior que zero.");
  }

  const pesoSemTara = pesoBruto.minus(tara);
  const pesoImpureza = pesoSemTara.times(impureza).dividedBy(100);
  const quantidade = pesoSemTara.minus(pesoImpureza).toDecimalPlaces(2);
  const subtotal = quantidade.times(preco).toDecimalPlaces(2);

  return { pesoBruto, tara, impureza, preco, quantidade, subtotal };
};

const buscarPedidoComCaixa = async (
  trx: Prisma.TransactionClient,
  id: number,
) => {
  const pedido = await trx.pedido.findUnique({
    where: { id },
    include: { caixa: true },
  });
  if (!pedido) {
    throw new NotFound("Pedido não encontrado.");
  }
  return pedido;
};

const exigirPedidoAbertoComCaixa = async (
  trx: Prisma.TransactionClient,
  id: number,
) => {
  const pedido = await buscarPedidoComCaixa(trx, id);
  if (pedido.status !== TipoStatusPedido.ABERTO) {
    throw new ConflictError("Somente pedidos abertos podem ser alterados.");
  }
  if (pedido.caixa.status !== "ABERTO") {
    throw new ConflictError(
      "O pedido não pode ser alterado porque seu caixa está fechado.",
    );
  }
  return pedido;
};

const recalcularTotal = async (trx: Prisma.TransactionClient, id: number) => {
  const total = await trx.itemPedido.aggregate({
    where: { pedidoID: id },
    _sum: { subtotal: true },
  });
  return trx.pedido.update({
    where: { id },
    data: { valor_total: total._sum.subtotal ?? new Prisma.Decimal(0) },
  });
};

const criar = async (tipo: TipoPedido, userID: number) =>
  prisma.$transaction(
    async (trx) => {
      const caixa = await trx.caixa.findFirst({
        where: { status: "ABERTO" },
        orderBy: { id: "desc" },
      });
      if (!caixa) {
        throw new ConflictError(
          "É necessário abrir o caixa antes de iniciar um pedido.",
        );
      }
      const pedido = await trx.pedido.create({
        data: { tipo, userID, caixaID: caixa.id },
        include: { items: true, caixa: true, registro: true },
      });
      return serializarPedido(pedido);
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

const listar = async (filtros: FiltrosPedido) => {
  const pedidos = await prisma.pedido.findMany({
    where: filtros,
    include: {
      registro: { select: { id: true, nome_razao: true, apelido: true } },
      caixa: { select: { id: true, status: true } },
      _count: { select: { items: true, lancamentos: true } },
    },
    orderBy: { criado_em: "desc" },
  });
  return pedidos.map(serializarPedido);
};

const buscarPorId = async (id: number) => {
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: {
      registro: true,
      caixa: true,
      user: { select: { id: true, nome: true } },
      items: { include: { material: true }, orderBy: { id: "asc" } },
      lancamentos: {
        include: { categoria: true, movimentacoes: true },
        orderBy: { id: "asc" },
      },
      movimentacoes: { orderBy: { id: "asc" } },
    },
  });
  if (!pedido) {
    throw new NotFound("Pedido não encontrado.");
  }
  return serializarPedido(pedido);
};

const definirRegistro = async (id: number, regID: number | null) =>
  prisma.$transaction(
    async (trx) => {
      await exigirPedidoAbertoComCaixa(trx, id);
      if (regID !== null) {
        const registro = await trx.registro.findUnique({
          where: { id: regID },
        });
        if (!registro || registro.deletedAt) {
          throw new NotFound("Registro não encontrado.");
        }
      }
      const pedido = await trx.pedido.update({
        where: { id },
        data: { regID },
        include: { registro: true, caixa: true, items: true },
      });
      return serializarPedido(pedido);
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

const adicionarItem = async (pedidoID: number, input: ItemInput) =>
  prisma.$transaction(
    async (trx) => {
      await exigirPedidoAbertoComCaixa(trx, pedidoID);
      const material = await trx.material.findUnique({
        where: { id: input.materialID },
      });
      if (!material || !material.status) {
        throw new NotFound("Material ativo não encontrado.");
      }

      const calculado = calcularItem(input);
      const item = await trx.itemPedido.create({
        data: { pedidoID, materialID: input.materialID, ...calculado },
        include: { material: true },
      });
      await recalcularTotal(trx, pedidoID);
      return serializarItem(item);
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

const atualizarItem = async (
  pedidoID: number,
  itemID: number,
  input: ItemInput,
) =>
  prisma.$transaction(
    async (trx) => {
      await exigirPedidoAbertoComCaixa(trx, pedidoID);
      const itemAtual = await trx.itemPedido.findFirst({
        where: { id: itemID, pedidoID },
      });
      if (!itemAtual) {
        throw new NotFound("Item do pedido não encontrado.");
      }
      const material = await trx.material.findUnique({
        where: { id: input.materialID },
      });
      if (!material || !material.status) {
        throw new NotFound("Material ativo não encontrado.");
      }

      const calculado = calcularItem(input);
      const item = await trx.itemPedido.update({
        where: { id: itemID },
        data: { materialID: input.materialID, ...calculado },
        include: { material: true },
      });
      await recalcularTotal(trx, pedidoID);
      return serializarItem(item);
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

const removerItem = async (pedidoID: number, itemID: number) =>
  prisma.$transaction(
    async (trx) => {
      await exigirPedidoAbertoComCaixa(trx, pedidoID);
      const item = await trx.itemPedido.findFirst({
        where: { id: itemID, pedidoID },
      });
      if (!item) {
        throw new NotFound("Item do pedido não encontrado.");
      }
      await trx.itemPedido.delete({ where: { id: itemID } });
      await recalcularTotal(trx, pedidoID);
      return { id: itemID, removido: true };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

const baixarLancamento = async (
  trx: Prisma.TransactionClient,
  props: {
    lancamento_id: number;
    tipo: TipoLancamento;
    titulo: string;
    valor: Prisma.Decimal;
    conta_id: number;
    user_id: number;
    caixa_id: number;
  },
) => {
  const conta = await trx.contaFinanceira.findUnique({
    where: { id: props.conta_id },
  });
  if (!conta || !conta.status) {
    throw new NotFound("Conta financeira ativa não encontrada.");
  }
  if (conta.conta_padrao) {
    const caixa = await trx.caixa.findFirst({
      where: { id: props.caixa_id, conta_id: conta.id, status: "ABERTO" },
    });
    if (!caixa) {
      throw new ConflictError(
        "A conta padrão não pode ser movimentada sem o caixa do pedido aberto.",
      );
    }
  }

  const entrada = props.tipo === TipoLancamento.RECEBER;
  const saldoFinal = entrada
    ? conta.saldo_atual.plus(props.valor)
    : conta.saldo_atual.minus(props.valor);
  await trx.contaFinanceira.update({
    where: { id: conta.id },
    data: { saldo_atual: saldoFinal },
  });
  await trx.lancamentoFinanceiro.update({
    where: { id: props.lancamento_id },
    data: { status: StatusLancamento.PAGO, data_baixa: new Date() },
  });
  await trx.movimentacaoFinanceira.create({
    data: {
      conta_id: conta.id,
      origem:
        props.tipo === TipoLancamento.RECEBER
          ? OrigemMovimentacao.PEDIDO_VENDA
          : OrigemMovimentacao.PEDIDO_COMPRA,
      origem_id: props.lancamento_id,
      descricao: `Baixa do pedido - ${props.titulo}`,
      direcao: entrada ? DirecaoFinanceira.ENTRADA : DirecaoFinanceira.SAIDA,
      saldo_inicial: conta.saldo_atual,
      valor: props.valor,
      saldo_final: saldoFinal,
      user_id: props.user_id,
      lancamento_id: props.lancamento_id,
      caixa_id: conta.conta_padrao ? props.caixa_id : null,
    },
  });
};

const finalizar = async (
  id: number,
  regID: number,
  titulos: TituloFinalizacao[],
  user_id: number,
) =>
  prisma.$transaction(
    async (trx) => {
      const pedido = await exigirPedidoAbertoComCaixa(trx, id);
      const registro = await trx.registro.findUnique({ where: { id: regID } });
      if (!registro || registro.deletedAt) {
        throw new NotFound("Registro não encontrado.");
      }
      const items = await trx.itemPedido.findMany({
        where: { pedidoID: id },
        include: { material: true },
      });
      if (items.length === 0) {
        throw new ConflictError("O pedido deve possuir ao menos um item.");
      }
      if (items.some((item) => !item.material.status)) {
        throw new ConflictError("O pedido possui material inativo.");
      }
      if (titulos.length === 0) {
        throw new ConflictError("Informe ao menos um lançamento financeiro.");
      }
      const totalTitulos = titulos.reduce(
        (total, titulo) => total.plus(titulo.valor),
        new Prisma.Decimal(0),
      );
      if (!totalTitulos.equals(pedido.valor_total)) {
        throw new ConflictError(
          "A soma dos lançamentos deve corresponder ao total do pedido.",
        );
      }

      const tipoLancamento =
        pedido.tipo === TipoPedido.COMPRA
          ? TipoLancamento.PAGAR
          : TipoLancamento.RECEBER;
      for (const titulo of titulos) {
        if (new Prisma.Decimal(titulo.valor).lessThanOrEqualTo(0)) {
          throw new ConflictError("O valor do lançamento deve ser positivo.");
        }
        if (titulo.baixar_agora && !titulo.conta_id) {
          throw new ConflictError(
            "A conta financeira é obrigatória para baixa imediata.",
          );
        }
        await categoriaLancamento.validarTipo(
          trx,
          titulo.categoria_id,
          tipoLancamento,
        );
      }

      for (const item of items) {
        const compra = pedido.tipo === TipoPedido.COMPRA;
        await trx.material.update({
          where: { id: item.materialID },
          data: {
            estoque: compra
              ? { increment: item.quantidade }
              : { decrement: item.quantidade },
          },
        });
        await trx.movimentacaoEstoque.create({
          data: {
            materialID: item.materialID,
            pedidoID: pedido.id,
            tipoMovimentacao: compra ? "COMPRA" : "VENDA",
            origem: "PEDIDO",
            origemID: pedido.id,
            quantidade: item.quantidade,
            observacao: `Finalização do pedido #${pedido.id}`,
          },
        });
      }

      for (const titulo of titulos) {
        const valor = new Prisma.Decimal(titulo.valor);
        const lancamento = await trx.lancamentoFinanceiro.create({
          data: {
            valor,
            descricao: titulo.descricao,
            tipo: tipoLancamento,
            titulo: titulo.titulo,
            status: StatusLancamento.ABERTO,
            categoria_id: titulo.categoria_id,
            vencimento: titulo.vencimento,
            user_id,
            registro_id: regID,
            pedido_id: pedido.id,
            caixa_id: pedido.caixaID,
          },
        });
        if (titulo.baixar_agora && titulo.conta_id) {
          await baixarLancamento(trx, {
            lancamento_id: lancamento.id,
            tipo: tipoLancamento,
            titulo: titulo.titulo,
            valor,
            conta_id: titulo.conta_id,
            user_id,
            caixa_id: pedido.caixaID,
          });
        }
      }

      await trx.pedido.update({
        where: { id },
        data: { regID, status: TipoStatusPedido.FECHADO },
      });
      return buscarPedidoComCliente(trx, id);
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

const buscarPedidoComCliente = async (
  trx: Prisma.TransactionClient,
  id: number,
) => {
  const pedido = await trx.pedido.findUniqueOrThrow({
    where: { id },
    include: {
      registro: true,
      caixa: true,
      items: { include: { material: true } },
      lancamentos: { include: { categoria: true, movimentacoes: true } },
      movimentacoes: true,
    },
  });
  return serializarPedido(pedido);
};

const cancelar = async (id: number) =>
  prisma.$transaction(
    async (trx) => {
      await exigirPedidoAbertoComCaixa(trx, id);
      const pedido = await trx.pedido.update({
        where: { id },
        data: { status: TipoStatusPedido.CANCELADO },
        include: { caixa: true, registro: true, items: true },
      });
      return serializarPedido(pedido);
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

const reabrir = async (id: number, user_id: number) =>
  prisma.$transaction(
    async (trx) => {
      const pedido = await buscarPedidoComCaixa(trx, id);
      if (pedido.status !== TipoStatusPedido.FECHADO) {
        throw new ConflictError(
          "Somente pedidos fechados podem ser reabertos.",
        );
      }
      if (pedido.caixa.status !== "ABERTO") {
        throw new ConflictError(
          "O pedido não pode ser reaberto porque seu caixa está fechado.",
        );
      }

      const movimentosEstoque = await trx.movimentacaoEstoque.findMany({
        where: {
          pedidoID: id,
          origem: "PEDIDO",
          devolvidaEm: null,
          devolucaoID: null,
        },
      });
      for (const movimento of movimentosEstoque) {
        const originalEntrada = movimento.tipoMovimentacao === "COMPRA";
        await trx.material.update({
          where: { id: movimento.materialID },
          data: {
            estoque: originalEntrada
              ? { decrement: movimento.quantidade }
              : { increment: movimento.quantidade },
          },
        });
        await trx.movimentacaoEstoque.create({
          data: {
            materialID: movimento.materialID,
            pedidoID: id,
            tipoMovimentacao: originalEntrada ? "VENDA" : "COMPRA",
            origem: "DEVOLUCAO",
            origemID: id,
            quantidade: movimento.quantidade,
            devolucaoID: movimento.id,
            observacao: `Reabertura do pedido #${id}`,
          },
        });
        await trx.movimentacaoEstoque.update({
          where: { id: movimento.id },
          data: { devolvidaEm: new Date() },
        });
      }

      const lancamentos = await trx.lancamentoFinanceiro.findMany({
        where: { pedido_id: id },
        include: {
          movimentacoes: {
            where: { estornada: false, estorno_de_id: null },
            orderBy: { id: "desc" },
            take: 1,
          },
        },
      });
      for (const lancamento of lancamentos) {
        const movimento = lancamento.movimentacoes[0];
        if (lancamento.status === StatusLancamento.PAGO && movimento) {
          const conta = await trx.contaFinanceira.findUnique({
            where: { id: movimento.conta_id },
          });
          if (!conta) {
            throw new NotFound("Conta financeira não encontrada.");
          }
          if (conta.conta_padrao && conta.id !== pedido.caixa.conta_id) {
            throw new ConflictError(
              "A baixa do pedido não pertence à conta do caixa vinculado.",
            );
          }
          const direcao: DirecaoFinanceira =
            movimento.direcao === DirecaoFinanceira.ENTRADA
              ? DirecaoFinanceira.SAIDA
              : DirecaoFinanceira.ENTRADA;
          const saldoFinal =
            direcao === DirecaoFinanceira.ENTRADA
              ? conta.saldo_atual.plus(movimento.valor)
              : conta.saldo_atual.minus(movimento.valor);
          await trx.contaFinanceira.update({
            where: { id: conta.id },
            data: { saldo_atual: saldoFinal },
          });
          await trx.movimentacaoFinanceira.update({
            where: { id: movimento.id },
            data: { estornada: true },
          });
          await trx.movimentacaoFinanceira.create({
            data: {
              conta_id: conta.id,
              origem: OrigemMovimentacao.ESTORNO,
              origem_id: lancamento.id,
              descricao: `Reabertura do pedido #${id}`,
              direcao,
              saldo_inicial: conta.saldo_atual,
              valor: movimento.valor,
              saldo_final: saldoFinal,
              user_id,
              lancamento_id: lancamento.id,
              caixa_id: conta.conta_padrao ? pedido.caixaID : null,
              estorno_de_id: movimento.id,
            },
          });
        }
        if (lancamento.status !== StatusLancamento.CANCELADO) {
          await trx.lancamentoFinanceiro.update({
            where: { id: lancamento.id },
            data: { status: StatusLancamento.CANCELADO },
          });
        }
      }

      await trx.pedido.update({
        where: { id },
        data: { status: TipoStatusPedido.ABERTO },
      });
      return buscarPedidoComCliente(trx, id);
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

export default {
  criar,
  listar,
  buscarPorId,
  definirRegistro,
  adicionarItem,
  atualizarItem,
  removerItem,
  finalizar,
  cancelar,
  reabrir,
};
