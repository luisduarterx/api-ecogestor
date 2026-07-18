import request from "supertest";
import { app } from "../../app";
import { prisma } from "../../libs/prisma";
import orchestrator from "../orchestrator";

export const prepararBasePedido = async () => {
  const user = await orchestrator.userAuthenticated({ nome: "ADMIN" });
  const conta = await orchestrator.createConta({
    nome: "CONTA PADRAO",
    conta_padrao: true,
    saldo_inicial: 1000,
  });
  const caixa = await orchestrator.abrirCaixa({
    user_id: user.id,
    conta_id: conta.id,
  });
  const tabela = await prisma.tabela.create({
    data: { nome: "TABELA PEDIDOS", padrao: true },
  });
  const registro = await prisma.registro.create({
    data: {
      nome_razao: "REGISTRO TESTE",
      tipo: "JURIDICA",
      tabelaID: tabela.id,
    },
  });
  const categoriaMaterial = await prisma.categoriaMaterial.create({
    data: { nome: "METAIS" },
  });
  const material = await prisma.material.create({
    data: {
      nome: "ALUMINIO",
      catID: categoriaMaterial.id,
      preco_venda: 3,
    },
  });
  return { user, conta, caixa, tabela, registro, categoriaMaterial, material };
};

export const criarPedido = async (
  jwt: string,
  tipo: "COMPRA" | "VENDA" = "COMPRA",
) => {
  const response = await request(app)
    .post("/v1/pedidos")
    .auth(jwt, { type: "bearer" })
    .send({ tipo })
    .expect(201);
  return response.body as {
    id: number;
    caixaID: number;
    status: "ABERTO";
    tipo: "COMPRA" | "VENDA";
  };
};

export const adicionarItem = async (
  jwt: string,
  pedidoID: number,
  materialID: number,
  valores?: Partial<{
    pesoBruto: string;
    tara: string;
    impureza: string;
    preco: string;
  }>,
) => {
  const response = await request(app)
    .post(`/v1/pedidos/${pedidoID}/itens`)
    .auth(jwt, { type: "bearer" })
    .send({
      materialID,
      pesoBruto: "100.00",
      tara: "10.00",
      impureza: "10.00",
      preco: "2.00",
      ...valores,
    })
    .expect(201);
  return response.body as { id: number; quantidade: number; subtotal: number };
};

export const criarPedidoComItem = async (
  tipo: "COMPRA" | "VENDA" = "COMPRA",
) => {
  const base = await prepararBasePedido();
  const pedido = await criarPedido(base.user.jwt, tipo);
  const item = await adicionarItem(
    base.user.jwt,
    pedido.id,
    base.material.id,
  );
  return { ...base, pedido, item };
};

export const criarCategoriaFinanceira = async (
  tipo: "RECEITA" | "DESPESA",
) =>
  prisma.categoriaLancamento.create({
    data: {
      nome: tipo === "RECEITA" ? "VENDAS" : "COMPRAS",
      TipoCategoria: tipo,
    },
  });

export const finalizarPedido = async (props: {
  jwt: string;
  pedidoID: number;
  registroID: number;
  categoriaID: number;
  baixarAgora?: boolean;
  contaID?: number;
}) => {
  const response = await request(app)
    .post(`/v1/pedidos/${props.pedidoID}/finalizar`)
    .auth(props.jwt, { type: "bearer" })
    .send({
      regID: props.registroID,
      titulos: [
        {
          valor: "162.00",
          vencimento: "2026-12-10",
          categoria_id: props.categoriaID,
          titulo: "TITULO DO PEDIDO",
          descricao: "LANCAMENTO GERADO PELO PEDIDO",
          baixar_agora: props.baixarAgora ?? false,
          conta_id: props.contaID,
        },
      ],
    })
    .expect(200);
  return response.body as { id: number; status: string };
};
