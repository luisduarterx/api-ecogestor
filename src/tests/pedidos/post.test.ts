import request from "supertest";
import { beforeEach, describe, expect, test } from "vitest";
import { app } from "../../app";
import orchestrator from "../orchestrator";
import { prepararBasePedido } from "./helpers";

beforeEach(orchestrator.clearDatabase);

describe("POST /v1/pedidos", () => {
  test("cria compra vinculada ao caixa aberto", async () => {
    const { user, caixa } = await prepararBasePedido();
    const response = await request(app)
      .post("/v1/pedidos")
      .auth(user.jwt, { type: "bearer" })
      .send({ tipo: "COMPRA" })
      .expect(201);
    expect(response.body).toMatchObject({
      tipo: "COMPRA",
      status: "ABERTO",
      caixaID: caixa.id,
      regID: null,
      valor_total: 0,
    });
  });

  test("cria venda", async () => {
    const { user } = await prepararBasePedido();
    const response = await request(app)
      .post("/v1/pedidos")
      .auth(user.jwt, { type: "bearer" })
      .send({ tipo: "VENDA" })
      .expect(201);
    expect(response.body.tipo).toBe("VENDA");
  });

  test("rejeita criação sem caixa aberto", async () => {
    const user = await orchestrator.userAuthenticated({});
    const response = await request(app)
      .post("/v1/pedidos")
      .auth(user.jwt, { type: "bearer" })
      .send({ tipo: "COMPRA" })
      .expect(409);
    expect(response.body.mensagem).toContain("abrir o caixa");
  });

  test.each([
    [{ tipo: "OUTRO" }],
    [{}],
    [{ tipo: "COMPRA", campo_extra: true }],
  ])("rejeita corpo inválido %#", async (body) => {
    const { user } = await prepararBasePedido();
    await request(app)
      .post("/v1/pedidos")
      .auth(user.jwt, { type: "bearer" })
      .send(body)
      .expect(400);
  });

  test("exige autenticação", async () => {
    await request(app).post("/v1/pedidos").send({ tipo: "COMPRA" }).expect(401);
  });

  test("exige permissão", async () => {
    const user = await orchestrator.createUserWithoutPermission({});
    await request(app)
      .post("/v1/pedidos")
      .auth(user.jwt, { type: "bearer" })
      .send({ tipo: "COMPRA" })
      .expect(401);
  });
});
