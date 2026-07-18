import request from "supertest";
import { beforeEach, describe, expect, test } from "vitest";
import { app } from "../../../../../app";
import { prisma } from "../../../../../libs/prisma";
import orchestrator from "../../../../orchestrator";
import {
  adicionarItem,
  criarPedido,
  prepararBasePedido,
} from "../../../helpers";

beforeEach(orchestrator.clearDatabase);

describe("PATCH /v1/pedidos/:id/itens/:itemId", () => {
  test("atualiza os dados calculados e o total do pedido", async () => {
    const { user, material } = await prepararBasePedido();
    const pedido = await criarPedido(user.jwt);
    const item = await adicionarItem(user.jwt, pedido.id, material.id);
    const response = await request(app)
      .patch(`/v1/pedidos/${pedido.id}/itens/${item.id}`)
      .auth(user.jwt, { type: "bearer" })
      .send({
        materialID: material.id,
        pesoBruto: "50.00",
        tara: "5.00",
        impureza: "20.00",
        preco: "3.00",
      })
      .expect(200);
    expect(response.body).toMatchObject({ quantidade: 36, subtotal: 108 });
    const persistido = await prisma.pedido.findUniqueOrThrow({
      where: { id: pedido.id },
    });
    expect(Number(persistido.valor_total)).toBe(108);
  });

  test("permite trocar por outro material ativo", async () => {
    const { user, material, categoriaMaterial } = await prepararBasePedido();
    const pedido = await criarPedido(user.jwt);
    const item = await adicionarItem(user.jwt, pedido.id, material.id);
    const outroMaterial = await prisma.material.create({
      data: { nome: "COBRE", catID: categoriaMaterial.id, preco_venda: 8 },
    });
    const response = await request(app)
      .patch(`/v1/pedidos/${pedido.id}/itens/${item.id}`)
      .auth(user.jwt, { type: "bearer" })
      .send({
        materialID: outroMaterial.id,
        pesoBruto: 10,
        tara: 0,
        impureza: 0,
        preco: 8,
      })
      .expect(200);
    expect(response.body.materialID).toBe(outroMaterial.id);
  });

  test("retorna 404 para item inexistente ou pertencente a outro pedido", async () => {
    const { user, material } = await prepararBasePedido();
    const pedido = await criarPedido(user.jwt);
    const outroPedido = await criarPedido(user.jwt);
    const item = await adicionarItem(user.jwt, outroPedido.id, material.id);
    for (const itemID of [item.id, 999999]) {
      await request(app)
        .patch(`/v1/pedidos/${pedido.id}/itens/${itemID}`)
        .auth(user.jwt, { type: "bearer" })
        .send({
          materialID: material.id,
          pesoBruto: 10,
          tara: 0,
          impureza: 0,
          preco: 1,
        })
        .expect(404);
    }
  });

  test("rejeita corpo e identificadores inválidos", async () => {
    const { user } = await prepararBasePedido();
    await request(app)
      .patch("/v1/pedidos/invalido/itens/0")
      .auth(user.jwt, { type: "bearer" })
      .send({})
      .expect(400);
  });

  test("não atualiza item de pedido fechado", async () => {
    const { user, material } = await prepararBasePedido();
    const pedido = await criarPedido(user.jwt);
    const item = await adicionarItem(user.jwt, pedido.id, material.id);
    await prisma.pedido.update({
      where: { id: pedido.id },
      data: { status: "FECHADO" },
    });
    await request(app)
      .patch(`/v1/pedidos/${pedido.id}/itens/${item.id}`)
      .auth(user.jwt, { type: "bearer" })
      .send({
        materialID: material.id,
        pesoBruto: 10,
        tara: 0,
        impureza: 0,
        preco: 1,
      })
      .expect(409);
  });

  test("exige autenticação", async () => {
    await request(app).patch("/v1/pedidos/1/itens/1").send({}).expect(401);
  });
});
