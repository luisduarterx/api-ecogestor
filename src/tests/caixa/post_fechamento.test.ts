import request from "supertest";
import { beforeEach, describe, expect, test } from "vitest";
import {
  DirecaoFinanceira,
  OrigemMovimentacao,
  StatusCaixa,
} from "../../../generated/prisma/enums";
import { app } from "../../app";
import { prisma } from "../../libs/prisma";
import orchestrator from "../orchestrator";

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

describe("POST /v1/financeiro/caixa/fechar", () => {
  test("não fecha o caixa enquanto existir pedido aberto vinculado", async () => {
    const user = await orchestrator.userAuthenticated({ nome: "ADMIN" });
    const conta = await orchestrator.createConta({
      conta_padrao: true,
      saldo_inicial: 1000,
      nome: "DINHEIRO",
    });
    const caixa = await orchestrator.abrirCaixa({
      user_id: user.id,
      conta_id: conta.id,
    });
    await prisma.pedido.create({
      data: { tipo: "COMPRA", userID: user.id, caixaID: caixa.id },
    });

    await request(app)
      .post("/v1/financeiro/caixa/fechar")
      .send({ saldo_informado: 1000 })
      .auth(user.jwt, { type: "bearer" })
      .expect(409);

    const caixaPersistido = await prisma.caixa.findUniqueOrThrow({
      where: { id: caixa.id },
    });
    expect(caixaPersistido.status).toBe(StatusCaixa.ABERTO);
  });

  test("fecha o caixa sem criar correção quando não existe diferença", async () => {
    const user = await orchestrator.userAuthenticated({ nome: "ADMIN" });
    const conta = await orchestrator.createConta({
      conta_padrao: true,
      saldo_inicial: 1000,
      nome: "DINHEIRO",
    });
    const caixa = await orchestrator.abrirCaixa({
      user_id: user.id,
      conta_id: conta.id,
    });

    const response = await request(app)
      .post("/v1/financeiro/caixa/fechar")
      .send({ saldo_informado: 1000, observacao: "SEM DIVERGÊNCIA" })
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toMatchObject({
      id: caixa.id,
      status: StatusCaixa.FECHADO,
      saldo_final_sistema: 1000,
      saldo_final_informado: 1000,
      diferenca: 0,
      usuario_fechamento_id: user.id,
      movimentacao_correcao: null,
    });
    expect(response.body.fechado_em).toEqual(expect.any(String));
  });

  test("calcula o saldo esperado a partir das movimentações do caixa", async () => {
    const user = await orchestrator.userAuthenticated({ nome: "ADMIN" });
    const conta = await orchestrator.createConta({
      conta_padrao: true,
      saldo_inicial: 1000,
      nome: "DINHEIRO",
    });
    const outraConta = await orchestrator.createConta({
      conta_padrao: false,
      saldo_inicial: 1000,
      nome: "BANCO",
    });
    await orchestrator.abrirCaixa({
      user_id: user.id,
      conta_id: conta.id,
    });
    await orchestrator.createTransferencia({
      conta_origem_id: conta.id,
      conta_destino_id: outraConta.id,
      valor: 250,
      user_id: user.id,
    });
    await orchestrator.createTransferencia({
      conta_origem_id: outraConta.id,
      conta_destino_id: conta.id,
      valor: 120,
      user_id: user.id,
    });

    const response = await request(app)
      .post("/v1/financeiro/caixa/fechar")
      .send({ saldo_informado: 870 })
      .auth(user.jwt, { type: "bearer" })
      .expect(200);

    expect(response.body).toMatchObject({
      saldo_final_sistema: 870,
      saldo_final_informado: 870,
      diferenca: 0,
      movimentacao_correcao: null,
    });
  });

  test("cria entrada de correção quando o saldo informado é maior", async () => {
    const user = await orchestrator.userAuthenticated({ nome: "ADMIN" });
    const conta = await orchestrator.createConta({
      conta_padrao: true,
      saldo_inicial: 1000,
      nome: "DINHEIRO",
    });
    await orchestrator.abrirCaixa({
      user_id: user.id,
      conta_id: conta.id,
    });

    const response = await request(app)
      .post("/v1/financeiro/caixa/fechar")
      .send({ saldo_informado: "1025.50", motivo: "SOBRA NO CAIXA" })
      .auth(user.jwt, { type: "bearer" })
      .expect(200);

    expect(response.body).toMatchObject({
      saldo_final_sistema: 1000,
      saldo_final_informado: 1025.5,
      diferenca: 25.5,
      movimentacao_correcao: {
        origem: OrigemMovimentacao.FECHAMENTO_CAIXA,
        direcao: DirecaoFinanceira.ENTRADA,
        valor: 25.5,
        motivo_ajuste: "SOBRA NO CAIXA",
      },
    });

    const contaAtualizada = await prisma.contaFinanceira.findUniqueOrThrow({
      where: { id: conta.id },
    });
    expect(Number(contaAtualizada.saldo_atual)).toBe(1025.5);
  });

  test("cria saída de correção quando o saldo informado é menor", async () => {
    const user = await orchestrator.userAuthenticated({ nome: "ADMIN" });
    const conta = await orchestrator.createConta({
      conta_padrao: true,
      saldo_inicial: 1000,
      nome: "DINHEIRO",
    });
    await orchestrator.abrirCaixa({
      user_id: user.id,
      conta_id: conta.id,
    });

    const response = await request(app)
      .post("/v1/financeiro/caixa/fechar")
      .send({ saldo_informado: 980, motivo: "FALTA NO CAIXA" })
      .auth(user.jwt, { type: "bearer" })
      .expect(200);

    expect(response.body).toMatchObject({
      diferenca: -20,
      movimentacao_correcao: {
        direcao: DirecaoFinanceira.SAIDA,
        valor: 20,
      },
    });
  });

  test("exige motivo quando existe diferença", async () => {
    const user = await orchestrator.userAuthenticated({ nome: "ADMIN" });
    const conta = await orchestrator.createConta({
      conta_padrao: true,
      saldo_inicial: 1000,
      nome: "DINHEIRO",
    });
    const caixa = await orchestrator.abrirCaixa({
      user_id: user.id,
      conta_id: conta.id,
    });

    await request(app)
      .post("/v1/financeiro/caixa/fechar")
      .send({ saldo_informado: 900 })
      .auth(user.jwt, { type: "bearer" })
      .expect(409);

    const caixaAindaAberto = await prisma.caixa.findUniqueOrThrow({
      where: { id: caixa.id },
    });
    expect(caixaAindaAberto.status).toBe(StatusCaixa.ABERTO);
  });

  test("retorna 404 quando não existe caixa aberto", async () => {
    const user = await orchestrator.userAuthenticated({ nome: "ADMIN" });

    await request(app)
      .post("/v1/financeiro/caixa/fechar")
      .send({ saldo_informado: 100 })
      .auth(user.jwt, { type: "bearer" })
      .expect(404);
  });

  test("exige autenticação", async () => {
    await request(app)
      .post("/v1/financeiro/caixa/fechar")
      .send({ saldo_informado: 100 })
      .expect("Content-Type", /json/)
      .expect(401);
  });
});
