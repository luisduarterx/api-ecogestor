import request from "supertest";
import { beforeEach, describe, expect, test } from "vitest";
import { app } from "../../../../app";
import { prisma } from "../../../../libs/prisma";
import orchestrator from "../../../orchestrator";
import { criarCategoriaFinanceira, criarPedidoComItem, finalizarPedido } from "../../helpers";

beforeEach(orchestrator.clearDatabase);

describe("POST /v1/pedidos/:id/reabrir", () => {
  test("reabre compra pendente com movimento inverso de estoque e cancelamento do lançamento", async () => {
    const { user, pedido, registro, material } = await criarPedidoComItem("COMPRA");
    const categoria = await criarCategoriaFinanceira("DESPESA");
    await finalizarPedido({ jwt: user.jwt, pedidoID: pedido.id, registroID: registro.id, categoriaID: categoria.id });
    const response = await request(app)
      .post(`/v1/pedidos/${pedido.id}/reabrir`)
      .auth(user.jwt, { type: "bearer" })
      .expect(200);
    expect(response.body.status).toBe("ABERTO");
    expect(Number((await prisma.material.findUniqueOrThrow({ where: { id: material.id } })).estoque)).toBe(0);
    const movimentos = await prisma.movimentacaoEstoque.findMany({ where: { pedidoID: pedido.id }, orderBy: { id: "asc" } });
    expect(movimentos).toHaveLength(2);
    expect(movimentos[0].devolvidaEm).not.toBeNull();
    expect(movimentos[1]).toMatchObject({ tipoMovimentacao: "VENDA", origem: "DEVOLUCAO", devolucaoID: movimentos[0].id });
    expect((await prisma.lancamentoFinanceiro.findFirstOrThrow({ where: { pedido_id: pedido.id } })).status).toBe("CANCELADO");
  });

  test("estorna baixa financeira mantendo histórico", async () => {
    const { user, pedido, registro, conta, caixa } = await criarPedidoComItem("COMPRA");
    const categoria = await criarCategoriaFinanceira("DESPESA");
    await finalizarPedido({ jwt: user.jwt, pedidoID: pedido.id, registroID: registro.id, categoriaID: categoria.id, baixarAgora: true, contaID: conta.id });
    await request(app).post(`/v1/pedidos/${pedido.id}/reabrir`).auth(user.jwt, { type: "bearer" }).expect(200);
    expect(Number((await prisma.contaFinanceira.findUniqueOrThrow({ where: { id: conta.id } })).saldo_atual)).toBe(1000);
    const movimentos = await prisma.movimentacaoFinanceira.findMany({ where: { lancamento: { pedido_id: pedido.id } }, orderBy: { id: "asc" } });
    expect(movimentos).toHaveLength(2);
    expect(movimentos[0].estornada).toBe(true);
    expect(movimentos[1]).toMatchObject({ origem: "ESTORNO", direcao: "ENTRADA", estorno_de_id: movimentos[0].id, caixa_id: caixa.id });
    expect((await prisma.lancamentoFinanceiro.findFirstOrThrow({ where: { pedido_id: pedido.id } })).status).toBe("CANCELADO");
  });

  test("reverte venda devolvendo a quantidade ao estoque", async () => {
    const { user, pedido, registro, material } = await criarPedidoComItem("VENDA");
    const categoria = await criarCategoriaFinanceira("RECEITA");
    await finalizarPedido({ jwt: user.jwt, pedidoID: pedido.id, registroID: registro.id, categoriaID: categoria.id });
    await request(app).post(`/v1/pedidos/${pedido.id}/reabrir`).auth(user.jwt, { type: "bearer" }).expect(200);
    expect(Number((await prisma.material.findUniqueOrThrow({ where: { id: material.id } })).estoque)).toBe(0);
    const inverso = await prisma.movimentacaoEstoque.findFirstOrThrow({ where: { pedidoID: pedido.id, origem: "DEVOLUCAO" } });
    expect(inverso.tipoMovimentacao).toBe("COMPRA");
  });

  test("não reabre pedido aberto, cancelado ou já reaberto", async () => {
    const aberto = await criarPedidoComItem();
    await request(app).post(`/v1/pedidos/${aberto.pedido.id}/reabrir`).auth(aberto.user.jwt, { type: "bearer" }).expect(409);

    await orchestrator.clearDatabase();
    const cancelado = await criarPedidoComItem();
    await request(app).post(`/v1/pedidos/${cancelado.pedido.id}/cancelar`).auth(cancelado.user.jwt, { type: "bearer" }).expect(200);
    await request(app).post(`/v1/pedidos/${cancelado.pedido.id}/reabrir`).auth(cancelado.user.jwt, { type: "bearer" }).expect(409);

    await orchestrator.clearDatabase();
    const reaberto = await criarPedidoComItem();
    const categoria = await criarCategoriaFinanceira("DESPESA");
    await finalizarPedido({ jwt: reaberto.user.jwt, pedidoID: reaberto.pedido.id, registroID: reaberto.registro.id, categoriaID: categoria.id });
    await request(app).post(`/v1/pedidos/${reaberto.pedido.id}/reabrir`).auth(reaberto.user.jwt, { type: "bearer" }).expect(200);
    await request(app).post(`/v1/pedidos/${reaberto.pedido.id}/reabrir`).auth(reaberto.user.jwt, { type: "bearer" }).expect(409);
  });

  test("não reabre pedido quando o caixa vinculado está fechado", async () => {
    const { user, pedido, registro, caixa } = await criarPedidoComItem();
    const categoria = await criarCategoriaFinanceira("DESPESA");
    await finalizarPedido({ jwt: user.jwt, pedidoID: pedido.id, registroID: registro.id, categoriaID: categoria.id });
    await prisma.caixa.update({ where: { id: caixa.id }, data: { status: "FECHADO", fechado_em: new Date() } });
    await request(app).post(`/v1/pedidos/${pedido.id}/reabrir`).auth(user.jwt, { type: "bearer" }).expect(409);
  });

  test("retorna 404 para pedido inexistente, valida id e autenticação", async () => {
    const { user } = await criarPedidoComItem();
    await request(app).post("/v1/pedidos/999999/reabrir").auth(user.jwt, { type: "bearer" }).expect(404);
    await request(app).post("/v1/pedidos/invalido/reabrir").auth(user.jwt, { type: "bearer" }).expect(400);
    await request(app).post("/v1/pedidos/1/reabrir").expect(401);
  });

  test("exige permissão", async () => {
    const user = await orchestrator.createUserWithoutPermission({});
    await request(app)
      .post("/v1/pedidos/1/reabrir")
      .auth(user.jwt, { type: "bearer" })
      .expect(401);
  });
});
