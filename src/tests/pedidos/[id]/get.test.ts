import request from "supertest";
import { beforeEach, describe, expect, test } from "vitest";
import { app } from "../../../app";
import orchestrator from "../../orchestrator";
import { criarPedidoComItem } from "../helpers";

beforeEach(orchestrator.clearDatabase);

describe("GET /v1/pedidos/:id", () => {
  test("consulta pedido com itens, caixa e usuário", async () => {
    const { user, pedido, item, caixa } = await criarPedidoComItem();
    const response = await request(app)
      .get(`/v1/pedidos/${pedido.id}`)
      .auth(user.jwt, { type: "bearer" })
      .expect(200);
    expect(response.body).toMatchObject({
      id: pedido.id,
      caixa: { id: caixa.id },
      user: { id: user.id },
      valor_total: 162,
    });
    expect(response.body.items[0]).toMatchObject({
      id: item.id,
      quantidade: 81,
      subtotal: 162,
    });
  });

  test("retorna 404 para pedido inexistente", async () => {
    const { user } = await criarPedidoComItem();
    await request(app)
      .get("/v1/pedidos/999999")
      .auth(user.jwt, { type: "bearer" })
      .expect(404);
  });

  test("rejeita id inválido", async () => {
    const { user } = await criarPedidoComItem();
    await request(app)
      .get("/v1/pedidos/invalido")
      .auth(user.jwt, { type: "bearer" })
      .expect(400);
  });

  test("exige autenticação e permissão", async () => {
    await request(app).get("/v1/pedidos/1").expect(401);
    const user = await orchestrator.createUserWithoutPermission({});
    await request(app)
      .get("/v1/pedidos/1")
      .auth(user.jwt, { type: "bearer" })
      .expect(401);
  });
});
