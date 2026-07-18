import request from "supertest";
import { beforeEach, describe, expect, test } from "vitest";
import { app } from "../../../../app";
import { prisma } from "../../../../libs/prisma";
import orchestrator from "../../../orchestrator";
import { criarPedidoComItem } from "../../helpers";

beforeEach(orchestrator.clearDatabase);

describe("POST /v1/pedidos/:id/cancelar", () => {
  test("cancela pedido aberto preservando itens e sem movimentar estoque ou financeiro", async () => {
    const { user, pedido, item, material } = await criarPedidoComItem();
    const response = await request(app)
      .post(`/v1/pedidos/${pedido.id}/cancelar`)
      .auth(user.jwt, { type: "bearer" })
      .expect(200);
    expect(response.body).toMatchObject({ id: pedido.id, status: "CANCELADO" });
    expect(response.body.items).toEqual(expect.arrayContaining([expect.objectContaining({ id: item.id })]));
    expect(Number((await prisma.material.findUniqueOrThrow({ where: { id: material.id } })).estoque)).toBe(0);
    expect(await prisma.movimentacaoEstoque.count({ where: { pedidoID: pedido.id } })).toBe(0);
    expect(await prisma.lancamentoFinanceiro.count({ where: { pedido_id: pedido.id } })).toBe(0);
  });

  test("não cancela pedido já cancelado ou fechado", async () => {
    const cancelado = await criarPedidoComItem();
    await request(app).post(`/v1/pedidos/${cancelado.pedido.id}/cancelar`).auth(cancelado.user.jwt, { type: "bearer" }).expect(200);
    await request(app).post(`/v1/pedidos/${cancelado.pedido.id}/cancelar`).auth(cancelado.user.jwt, { type: "bearer" }).expect(409);

    await orchestrator.clearDatabase();
    const fechado = await criarPedidoComItem();
    await prisma.pedido.update({ where: { id: fechado.pedido.id }, data: { status: "FECHADO" } });
    await request(app).post(`/v1/pedidos/${fechado.pedido.id}/cancelar`).auth(fechado.user.jwt, { type: "bearer" }).expect(409);
  });

  test("não cancela pedido cujo caixa está fechado", async () => {
    const { user, pedido, caixa } = await criarPedidoComItem();
    await prisma.caixa.update({ where: { id: caixa.id }, data: { status: "FECHADO", fechado_em: new Date() } });
    await request(app)
      .post(`/v1/pedidos/${pedido.id}/cancelar`)
      .auth(user.jwt, { type: "bearer" })
      .expect(409);
    expect((await prisma.pedido.findUniqueOrThrow({ where: { id: pedido.id } })).status).toBe("ABERTO");
  });

  test("retorna 404 para pedido inexistente e 400 para id inválido", async () => {
    const { user } = await criarPedidoComItem();
    await request(app).post("/v1/pedidos/999999/cancelar").auth(user.jwt, { type: "bearer" }).expect(404);
    await request(app).post("/v1/pedidos/invalido/cancelar").auth(user.jwt, { type: "bearer" }).expect(400);
  });

  test("exige autenticação", async () => {
    await request(app).post("/v1/pedidos/1/cancelar").expect(401);
  });

  test("exige permissão", async () => {
    const user = await orchestrator.createUserWithoutPermission({});
    await request(app)
      .post("/v1/pedidos/1/cancelar")
      .auth(user.jwt, { type: "bearer" })
      .expect(401);
  });
});
