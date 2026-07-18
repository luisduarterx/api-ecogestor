import request from "supertest";
import { beforeEach, describe, expect, test } from "vitest";
import { app } from "../../../../../app";
import { prisma } from "../../../../../libs/prisma";
import orchestrator from "../../../../orchestrator";
import { adicionarItem, criarPedido, prepararBasePedido } from "../../../helpers";

beforeEach(orchestrator.clearDatabase);

describe("DELETE /v1/pedidos/:id/itens/:itemId", () => {
  test("remove o item e recalcula o total do pedido", async () => {
    const { user, material } = await prepararBasePedido();
    const pedido = await criarPedido(user.jwt);
    const item = await adicionarItem(user.jwt, pedido.id, material.id);
    const response = await request(app)
      .delete(`/v1/pedidos/${pedido.id}/itens/${item.id}`)
      .auth(user.jwt, { type: "bearer" })
      .expect(200);
    expect(response.body).toEqual({ id: item.id, removido: true });
    const persistido = await prisma.pedido.findUniqueOrThrow({ where: { id: pedido.id } });
    expect(Number(persistido.valor_total)).toBe(0);
    expect(await prisma.itemPedido.count({ where: { pedidoID: pedido.id } })).toBe(0);
  });

  test("retorna 404 para item inexistente ou de outro pedido", async () => {
    const { user, material } = await prepararBasePedido();
    const pedido = await criarPedido(user.jwt);
    const outroPedido = await criarPedido(user.jwt);
    const item = await adicionarItem(user.jwt, outroPedido.id, material.id);
    for (const itemID of [item.id, 999999]) {
      await request(app)
        .delete(`/v1/pedidos/${pedido.id}/itens/${itemID}`)
        .auth(user.jwt, { type: "bearer" })
        .expect(404);
    }
  });

  test("rejeita identificadores inválidos", async () => {
    const { user } = await prepararBasePedido();
    await request(app)
      .delete("/v1/pedidos/invalido/itens/0")
      .auth(user.jwt, { type: "bearer" })
      .expect(400);
  });

  test("não remove item de pedido fechado", async () => {
    const { user, material } = await prepararBasePedido();
    const pedido = await criarPedido(user.jwt);
    const item = await adicionarItem(user.jwt, pedido.id, material.id);
    await prisma.pedido.update({ where: { id: pedido.id }, data: { status: "FECHADO" } });
    await request(app)
      .delete(`/v1/pedidos/${pedido.id}/itens/${item.id}`)
      .auth(user.jwt, { type: "bearer" })
      .expect(409);
  });

  test("exige autenticação", async () => {
    await request(app).delete("/v1/pedidos/1/itens/1").expect(401);
  });
});
