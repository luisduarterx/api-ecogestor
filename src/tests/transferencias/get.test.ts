import request from "supertest";
import { app } from "../../app";
import { test, beforeEach, expect, describe } from "vitest";
import orchestrator from "../orchestrator";
import { gerarToken } from "../../services/jwt";

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

describe("GET /v1/financeiro/transferencia", () => {
  test("Deve trazer todos os resultados filtrados ", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const b1 = await orchestrator.createConta({
      nome: "b1",
      saldo_inicial: 2,
      conta_padrao: false,
    });
    const b2 = await orchestrator.createConta({
      nome: "b2",
      saldo_inicial: 0,
      conta_padrao: false,
    });
    const t1 = await orchestrator.createTransferencia({
      valor: 50.0,
      conta_origem_id: b1.id,
      conta_destino_id: b2.id,
      user_id: user.id,
    });
    const t2 = await orchestrator.createTransferencia({
      valor: 50.0,
      conta_origem_id: b1.id,
      conta_destino_id: b2.id,
      user_id: user.id,
    });

    const response = await request(app)
      .get(
        "/v1/financeiro/transferencia?dataInicial=2026-07-12&dataFinal=2026-07-12",
      )
      .expect(200)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);
    console.log(response.body);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
  });

  test("Com token JWT valido e usuario inexistente", async () => {
    const token = gerarToken({ nome: "luis" });

    const response = await request(app)
      .get("/v1/financeiro/transferencia")
      .auth(token, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toEqual({
      nome: "Acesso não Autorizado",
      mensagem: "Você não tem permissão para acessar essa página",
      acao: "Verifique suas permissões ou contate um administrador",
      statusCode: 401,
    });
  });
  test("Com token JWT invalido", async () => {
    const response = await request(app)
      .get("/v1/financeiro/transferencia")
      .auth("werwefa3w4t534tqwefwq", { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toEqual({
      nome: "Acesso não Autorizado",
      mensagem: "Token Invalido",
      acao: "Verifique suas permissões ou contate um administrador",
      statusCode: 401,
    });
  });
  test("Usuário válido, sem permissão de acesso", async () => {
    const user = await orchestrator.createUserWithoutPermission({
      nome: "SEM PERMISSAO",
    });
    const response = await request(app)
      .get("/v1/financeiro/transferencia")
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toEqual({
      nome: "Acesso não Autorizado",
      mensagem: "Você não tem permissão para acessar essa página",
      acao: "Verifique suas permissões ou contate um administrador",
      statusCode: 401,
    });
  });

  test("Sem um Bearer token", async () => {
    const response = await request(app)
      .get("/v1/cargos/")

      .expect("Content-Type", /json/)
      .expect(401);

    expect(response.body).toEqual({
      nome: "Acesso não Autorizado",
      mensagem: "Você não tem permissão para acessar essa página",
      acao: "Verifique suas permissões ou contate um administrador",
      statusCode: 401,
    });
  });
});
