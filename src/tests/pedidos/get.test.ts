import request from "supertest";
import { beforeEach, describe, expect, test } from "vitest";
import { app } from "../../app";
import orchestrator from "../orchestrator";
import { criarPedido, prepararBasePedido } from "./helpers";

beforeEach(orchestrator.clearDatabase);

describe("GET /v1/pedidos", () => {
  test("lista pedidos com valores numéricos e contagens", async () => {
    const { user, caixa } = await prepararBasePedido();
    await criarPedido(user.jwt, "COMPRA");
    await criarPedido(user.jwt, "VENDA");
    const response = await request(app)
      .get("/v1/pedidos")
      .auth(user.jwt, { type: "bearer" })
      .expect(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toEqual(
      expect.objectContaining({
        caixaID: caixa.id,
        valor_total: expect.any(Number),
        _count: { items: 0, lancamentos: 0 },
      }),
    );
  });

  test("filtra por tipo, status e caixa", async () => {
    const { user, caixa } = await prepararBasePedido();
    await criarPedido(user.jwt, "COMPRA");
    await criarPedido(user.jwt, "VENDA");
    const response = await request(app)
      .get("/v1/pedidos")
      .query({ tipo: "VENDA", status: "ABERTO", caixaID: caixa.id })
      .auth(user.jwt, { type: "bearer" })
      .expect(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].tipo).toBe("VENDA");
  });

  test("rejeita filtro inválido", async () => {
    const { user } = await prepararBasePedido();
    await request(app)
      .get("/v1/pedidos?status=INVALIDO")
      .auth(user.jwt, { type: "bearer" })
      .expect(400);
  });

  test("exige autenticação", async () => {
    await request(app).get("/v1/pedidos").expect(401);
  });

  test("exige permissão", async () => {
    const user = await orchestrator.createUserWithoutPermission({});
    await request(app)
      .get("/v1/pedidos")
      .auth(user.jwt, { type: "bearer" })
      .expect(401);
  });
});
