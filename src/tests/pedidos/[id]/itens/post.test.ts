import request from "supertest";
import { beforeEach, describe, expect, test } from "vitest";
import { app } from "../../../../app";
import { prisma } from "../../../../libs/prisma";
import orchestrator from "../../../orchestrator";
import { adicionarItem, criarPedido, prepararBasePedido } from "../../helpers";

beforeEach(orchestrator.clearDatabase);

describe("POST /v1/pedidos/:id/itens", () => {
  test("calcula quantidade após tara e percentual de impureza", async () => {
    const { user, material } = await prepararBasePedido();
    const pedido = await criarPedido(user.jwt);
    const response = await request(app)
      .post(`/v1/pedidos/${pedido.id}/itens`)
      .auth(user.jwt, { type: "bearer" })
      .send({
        materialID: material.id,
        pesoBruto: "100.00",
        tara: "10.00",
        impureza: "10.00",
        preco: "2.35",
      })
      .expect(201);
    expect(response.body).toMatchObject({
      quantidade: 81,
      preco: 2.35,
      subtotal: 190.35,
    });
    const persistido = await prisma.pedido.findUniqueOrThrow({
      where: { id: pedido.id },
    });
    expect(Number(persistido.valor_total)).toBe(190.35);
  });

  test("aceita preço manual sem consultar tabela de preços", async () => {
    const { user, material } = await prepararBasePedido();
    const pedido = await criarPedido(user.jwt);
    const item = await adicionarItem(user.jwt, pedido.id, material.id, {
      preco: "7.25",
    });
    expect(item).toMatchObject({ quantidade: 81, subtotal: 587.25 });
  });

  test("rejeita material inativo ou inexistente", async () => {
    const { user, material } = await prepararBasePedido();
    const pedido = await criarPedido(user.jwt);
    await prisma.material.update({
      where: { id: material.id },
      data: { status: false },
    });
    for (const materialID of [material.id, 999999]) {
      await request(app)
        .post(`/v1/pedidos/${pedido.id}/itens`)
        .auth(user.jwt, { type: "bearer" })
        .send({ materialID, pesoBruto: 20, tara: 0, impureza: 0, preco: 1 })
        .expect(404);
    }
  });

  test.each([
    { materialID: 1, pesoBruto: 10, tara: 10, impureza: 0, preco: 1 },
    { materialID: 1, pesoBruto: 10, tara: 11, impureza: 0, preco: 1 },
    { materialID: 1, pesoBruto: 10, tara: 0, impureza: 100, preco: 1 },
  ])("rejeita pesos ou impureza fora da regra %#", async (body) => {
    const { user, material } = await prepararBasePedido();
    const pedido = await criarPedido(user.jwt);
    await request(app)
      .post(`/v1/pedidos/${pedido.id}/itens`)
      .auth(user.jwt, { type: "bearer" })
      .send({ ...body, materialID: material.id })
      .expect(409);
  });

  test.each([
    {},
    { materialID: 1, pesoBruto: 0, tara: 0, impureza: 0, preco: 1 },
    { materialID: 1, pesoBruto: 10, tara: 0, impureza: -1, preco: 1 },
    { materialID: 1, pesoBruto: 10, tara: 0, impureza: 0, preco: 0 },
    { materialID: 1, pesoBruto: "10.001", tara: 0, impureza: 0, preco: 1 },
  ])("rejeita corpo inválido %#", async (body) => {
    const { user } = await prepararBasePedido();
    const pedido = await criarPedido(user.jwt);
    await request(app)
      .post(`/v1/pedidos/${pedido.id}/itens`)
      .auth(user.jwt, { type: "bearer" })
      .send(body)
      .expect(400);
  });

  test("não adiciona item a pedido fechado", async () => {
    const { user, material } = await prepararBasePedido();
    const pedido = await criarPedido(user.jwt);
    await prisma.pedido.update({
      where: { id: pedido.id },
      data: { status: "FECHADO" },
    });
    await request(app)
      .post(`/v1/pedidos/${pedido.id}/itens`)
      .auth(user.jwt, { type: "bearer" })
      .send({
        materialID: material.id,
        pesoBruto: 20,
        tara: 0,
        impureza: 0,
        preco: 1,
      })
      .expect(409);
  });

  test("exige autenticação", async () => {
    await request(app).post("/v1/pedidos/1/itens").send({}).expect(401);
  });

  test("exige permissão", async () => {
    const user = await orchestrator.createUserWithoutPermission({});
    await request(app)
      .post("/v1/pedidos/1/itens")
      .auth(user.jwt, { type: "bearer" })
      .send({})
      .expect(401);
  });
});
