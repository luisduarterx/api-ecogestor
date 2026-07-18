import request from "supertest";
import { beforeEach, describe, expect, test } from "vitest";
import { app } from "../../../../app";
import { prisma } from "../../../../libs/prisma";
import orchestrator from "../../../orchestrator";
import { criarPedido, prepararBasePedido } from "../../helpers";

beforeEach(orchestrator.clearDatabase);

describe("PATCH /v1/pedidos/:id/registro", () => {
  test("vincula e remove o registro de um pedido aberto", async () => {
    const { user, registro } = await prepararBasePedido();
    const pedido = await criarPedido(user.jwt);

    const vinculado = await request(app)
      .patch(`/v1/pedidos/${pedido.id}/registro`)
      .auth(user.jwt, { type: "bearer" })
      .send({ regID: registro.id })
      .expect(200);
    expect(vinculado.body).toMatchObject({
      id: pedido.id,
      regID: registro.id,
      registro: { id: registro.id },
    });

    const removido = await request(app)
      .patch(`/v1/pedidos/${pedido.id}/registro`)
      .auth(user.jwt, { type: "bearer" })
      .send({ regID: null })
      .expect(200);
    expect(removido.body).toMatchObject({ regID: null, registro: null });
  });

  test("retorna 404 para pedido ou registro inexistente", async () => {
    const { user } = await prepararBasePedido();
    const pedido = await criarPedido(user.jwt);
    await request(app)
      .patch("/v1/pedidos/999999/registro")
      .auth(user.jwt, { type: "bearer" })
      .send({ regID: null })
      .expect(404);
    await request(app)
      .patch(`/v1/pedidos/${pedido.id}/registro`)
      .auth(user.jwt, { type: "bearer" })
      .send({ regID: 999999 })
      .expect(404);
  });

  test("rejeita registro excluído", async () => {
    const { user, registro } = await prepararBasePedido();
    const pedido = await criarPedido(user.jwt);
    await prisma.registro.update({
      where: { id: registro.id },
      data: { deletedAt: new Date() },
    });
    await request(app)
      .patch(`/v1/pedidos/${pedido.id}/registro`)
      .auth(user.jwt, { type: "bearer" })
      .send({ regID: registro.id })
      .expect(404);
  });

  test.each([{ regID: 0 }, { regID: "abc" }, {}, { regID: null, extra: true }])(
    "rejeita corpo inválido %#",
    async (body) => {
      const { user } = await prepararBasePedido();
      const pedido = await criarPedido(user.jwt);
      await request(app)
        .patch(`/v1/pedidos/${pedido.id}/registro`)
        .auth(user.jwt, { type: "bearer" })
        .send(body)
        .expect(400);
    },
  );

  test("não altera pedido fechado", async () => {
    const { user, registro } = await prepararBasePedido();
    const pedido = await criarPedido(user.jwt);
    await prisma.pedido.update({ where: { id: pedido.id }, data: { status: "FECHADO" } });
    await request(app)
      .patch(`/v1/pedidos/${pedido.id}/registro`)
      .auth(user.jwt, { type: "bearer" })
      .send({ regID: registro.id })
      .expect(409);
  });

  test("exige autenticação", async () => {
    await request(app)
      .patch("/v1/pedidos/1/registro")
      .send({ regID: null })
      .expect(401);
  });

  test("exige permissão", async () => {
    const user = await orchestrator.createUserWithoutPermission({});
    await request(app)
      .patch("/v1/pedidos/1/registro")
      .auth(user.jwt, { type: "bearer" })
      .send({ regID: null })
      .expect(401);
  });
});
