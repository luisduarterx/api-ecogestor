import request from "supertest";
import { beforeEach, describe, expect, test } from "vitest";
import { app } from "../../app";
import orchestrator from "../orchestrator";

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

describe("consultas de caixa", () => {
  test("GET /v1/financeiro/caixas lista os caixas", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const conta = await orchestrator.createConta({
      conta_padrao: true,
      saldo_inicial: 1000,
      nome: "DINHEIRO",
    });
    const caixa = await orchestrator.abrirCaixa({
      user_id: user.id,
      conta_id: conta.id,
      observacao: "ABERTURA DO DIA",
    });

    const response = await request(app)
      .get("/v1/financeiro/caixas")
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      id: caixa.id,
      conta: { id: conta.id, nome: conta.nome },
      saldo_inicial: 1000,
      usuario_abertura: { id: user.id, nome: user.nome },
    });
  });

  test("GET /v1/financeiro/caixa/:id retorna um caixa e suas movimentações", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const conta = await orchestrator.createConta({
      conta_padrao: true,
      saldo_inicial: 1000,
      nome: "DINHEIRO",
    });
    const destino = await orchestrator.createConta({
      conta_padrao: false,
      saldo_inicial: 100,
      nome: "BANCO",
    });
    const caixa = await orchestrator.abrirCaixa({
      user_id: user.id,
      conta_id: conta.id,
    });
    await orchestrator.createTransferencia({
      conta_origem_id: conta.id,
      conta_destino_id: destino.id,
      valor: 50,
      user_id: user.id,
    });

    const response = await request(app)
      .get(`/v1/financeiro/caixa/${caixa.id}`)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toMatchObject({
      id: caixa.id,
      conta: { id: conta.id, nome: conta.nome },
      saldo_inicial: 1000,
    });
    expect(response.body.movimentacoes).toHaveLength(1);
    expect(response.body.movimentacoes[0].conta_id).toBe(conta.id);
    expect(
      response.body.movimentacoes.every(
        (movimentacao: { valor: unknown }) =>
          typeof movimentacao.valor === "number",
      ),
    ).toBe(true);
  });

  test("GET /v1/financeiro/caixa/:id retorna 404 para caixa inexistente", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const response = await request(app)
      .get("/v1/financeiro/caixa/999999")
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(404);

    expect(response.body).toMatchObject({
      mensagem: "Caixa não encontrado.",
      statusCode: 404,
    });
  });

  test("GET /v1/financeiro/caixas rejeita intervalo de datas invertido", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    await request(app)
      .get("/v1/financeiro/caixas")
      .query({ dataInicial: "2026-07-18", dataFinal: "2026-07-17" })
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(400);
  });
});
