import request from "supertest";
import { beforeEach, describe, expect, test } from "vitest";
import { app } from "../../../../app";
import { prisma } from "../../../../libs/prisma";
import orchestrator from "../../../orchestrator";
import {
  criarCategoriaFinanceira,
  criarPedido,
  criarPedidoComItem,
  finalizarPedido,
} from "../../helpers";

beforeEach(orchestrator.clearDatabase);

describe("POST /v1/pedidos/:id/finalizar", () => {
  test("finaliza compra, entra no estoque e cria lançamento pendente vinculado ao caixa", async () => {
    const { user, pedido, registro, material, caixa } = await criarPedidoComItem("COMPRA");
    const categoria = await criarCategoriaFinanceira("DESPESA");
    const response = await finalizarPedido({
      jwt: user.jwt,
      pedidoID: pedido.id,
      registroID: registro.id,
      categoriaID: categoria.id,
    });
    expect(response).toMatchObject({ status: "FECHADO", regID: registro.id, caixaID: caixa.id });
    const materialAtual = await prisma.material.findUniqueOrThrow({ where: { id: material.id } });
    expect(Number(materialAtual.estoque)).toBe(81);
    const lancamento = await prisma.lancamentoFinanceiro.findFirstOrThrow({ where: { pedido_id: pedido.id } });
    expect(lancamento).toMatchObject({ tipo: "PAGAR", status: "ABERTO", caixa_id: caixa.id });
    const movimento = await prisma.movimentacaoEstoque.findFirstOrThrow({ where: { pedidoID: pedido.id } });
    expect(movimento).toMatchObject({ tipoMovimentacao: "COMPRA", origem: "PEDIDO", origemID: pedido.id });
  });

  test("finaliza venda com estoque negativo e lançamento a receber", async () => {
    const { user, pedido, registro, material, caixa } = await criarPedidoComItem("VENDA");
    const categoria = await criarCategoriaFinanceira("RECEITA");
    await finalizarPedido({
      jwt: user.jwt,
      pedidoID: pedido.id,
      registroID: registro.id,
      categoriaID: categoria.id,
    });
    const materialAtual = await prisma.material.findUniqueOrThrow({ where: { id: material.id } });
    expect(Number(materialAtual.estoque)).toBe(-81);
    const lancamento = await prisma.lancamentoFinanceiro.findFirstOrThrow({ where: { pedido_id: pedido.id } });
    expect(lancamento).toMatchObject({ tipo: "RECEBER", status: "ABERTO", caixa_id: caixa.id });
  });

  test("baixa compra imediatamente e vincula o movimento financeiro ao caixa", async () => {
    const { user, pedido, registro, conta, caixa } = await criarPedidoComItem("COMPRA");
    const categoria = await criarCategoriaFinanceira("DESPESA");
    await finalizarPedido({
      jwt: user.jwt,
      pedidoID: pedido.id,
      registroID: registro.id,
      categoriaID: categoria.id,
      baixarAgora: true,
      contaID: conta.id,
    });
    const lancamento = await prisma.lancamentoFinanceiro.findFirstOrThrow({ where: { pedido_id: pedido.id } });
    expect(lancamento.status).toBe("PAGO");
    const movimento = await prisma.movimentacaoFinanceira.findFirstOrThrow({ where: { lancamento_id: lancamento.id } });
    expect(movimento).toMatchObject({ direcao: "SAIDA", caixa_id: caixa.id, origem: "PEDIDO_COMPRA" });
    expect(Number(movimento.valor)).toBe(162);
    const contaAtual = await prisma.contaFinanceira.findUniqueOrThrow({ where: { id: conta.id } });
    expect(Number(contaAtual.saldo_atual)).toBe(838);
  });

  test("aceita múltiplos títulos cuja soma corresponde ao total", async () => {
    const { user, pedido, registro, caixa } = await criarPedidoComItem();
    const categoria = await criarCategoriaFinanceira("DESPESA");
    const response = await request(app)
      .post(`/v1/pedidos/${pedido.id}/finalizar`)
      .auth(user.jwt, { type: "bearer" })
      .send({
        regID: registro.id,
        titulos: [
          { valor: "80.00", vencimento: "2026-12-10", categoria_id: categoria.id, titulo: "PARCELA UM", descricao: "PRIMEIRA PARCELA", baixar_agora: false },
          { valor: "82.00", vencimento: "2027-01-10", categoria_id: categoria.id, titulo: "PARCELA DOIS", descricao: "SEGUNDA PARCELA", baixar_agora: false },
        ],
      })
      .expect(200);
    expect(response.body.lancamentos).toHaveLength(2);
    expect(response.body.lancamentos.every((item: { caixa_id: number }) => item.caixa_id === caixa.id)).toBe(true);
  });

  test("rejeita soma de títulos diferente do total sem efeitos parciais", async () => {
    const { user, pedido, registro, material } = await criarPedidoComItem();
    const categoria = await criarCategoriaFinanceira("DESPESA");
    await request(app)
      .post(`/v1/pedidos/${pedido.id}/finalizar`)
      .auth(user.jwt, { type: "bearer" })
      .send({ regID: registro.id, titulos: [{ valor: "161.99", vencimento: "2026-12-10", categoria_id: categoria.id, titulo: "VALOR INCORRETO", descricao: "NAO DEVE PERSISTIR" }] })
      .expect(409);
    const materialAtual = await prisma.material.findUniqueOrThrow({ where: { id: material.id } });
    expect(Number(materialAtual.estoque)).toBe(0);
    expect(await prisma.lancamentoFinanceiro.count({ where: { pedido_id: pedido.id } })).toBe(0);
    expect((await prisma.pedido.findUniqueOrThrow({ where: { id: pedido.id } })).status).toBe("ABERTO");
  });

  test("rejeita categoria incompatível com o tipo do pedido", async () => {
    const { user, pedido, registro } = await criarPedidoComItem("COMPRA");
    const categoria = await criarCategoriaFinanceira("RECEITA");
    await request(app)
      .post(`/v1/pedidos/${pedido.id}/finalizar`)
      .auth(user.jwt, { type: "bearer" })
      .send({ regID: registro.id, titulos: [{ valor: "162.00", vencimento: "2026-12-10", categoria_id: categoria.id, titulo: "CATEGORIA ERRADA", descricao: "CATEGORIA INCOMPATIVEL" }] })
      .expect(409);
  });

  test("exige item, registro existente e conta na baixa imediata", async () => {
    const base = await criarPedidoComItem();
    const vazio = await criarPedido(base.user.jwt);
    const categoria = await criarCategoriaFinanceira("DESPESA");
    const titulo = { valor: "162.00", vencimento: "2026-12-10", categoria_id: categoria.id, titulo: "TITULO TESTE", descricao: "DESCRICAO TESTE" };
    await request(app).post(`/v1/pedidos/${vazio.id}/finalizar`).auth(base.user.jwt, { type: "bearer" }).send({ regID: base.registro.id, titulos: [titulo] }).expect(409);
    await request(app).post(`/v1/pedidos/${base.pedido.id}/finalizar`).auth(base.user.jwt, { type: "bearer" }).send({ regID: 999999, titulos: [titulo] }).expect(404);
    await request(app).post(`/v1/pedidos/${base.pedido.id}/finalizar`).auth(base.user.jwt, { type: "bearer" }).send({ regID: base.registro.id, titulos: [{ ...titulo, baixar_agora: true }] }).expect(409);
  });

  test("não finaliza duas vezes", async () => {
    const { user, pedido, registro } = await criarPedidoComItem();
    const categoria = await criarCategoriaFinanceira("DESPESA");
    await finalizarPedido({ jwt: user.jwt, pedidoID: pedido.id, registroID: registro.id, categoriaID: categoria.id });
    await request(app)
      .post(`/v1/pedidos/${pedido.id}/finalizar`)
      .auth(user.jwt, { type: "bearer" })
      .send({ regID: registro.id, titulos: [{ valor: "162.00", vencimento: "2026-12-10", categoria_id: categoria.id, titulo: "SEGUNDA TENTATIVA", descricao: "NAO PODE FINALIZAR" }] })
      .expect(409);
  });

  test("rejeita corpo inválido e exige autenticação", async () => {
    const { user, pedido } = await criarPedidoComItem();
    await request(app).post(`/v1/pedidos/${pedido.id}/finalizar`).auth(user.jwt, { type: "bearer" }).send({ titulos: [] }).expect(400);
    await request(app).post(`/v1/pedidos/${pedido.id}/finalizar`).send({}).expect(401);
  });

  test("exige permissão", async () => {
    const user = await orchestrator.createUserWithoutPermission({});
    await request(app)
      .post("/v1/pedidos/1/finalizar")
      .auth(user.jwt, { type: "bearer" })
      .send({})
      .expect(401);
  });
});
