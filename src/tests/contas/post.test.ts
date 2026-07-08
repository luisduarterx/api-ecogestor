import request from "supertest";
import { app } from "../../app";
import { test, beforeEach, expect, describe } from "vitest";
import orchestrator from "../orchestrator";
import { gerarToken } from "../../services/jwt";

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

describe("POST /v1/contas", () => {
  test("Com dados válidos", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const banco = {
      nome: "BANCO NoVO",
      saldo_inicial: 1000.45,
    };

    const response = await request(app)
      .post("/v1/contas")
      .send(banco)
      .expect(201)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      id: response.body.id,
      conta_padrao: false,
      criado_em: response.body.criado_em,
      atualizado_em: response.body.atualizado_em,
      nome: "BANCO NOVO",
      saldo_inicial: 1000.45,
      saldo_atual: 1000.45,
      status: true,
    });
  });
  test("Deve criar uma conta padrão", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const banco = {
      nome: "BANCO NoVO",
      saldo_inicial: 1000.45,
      conta_padrao: true,
    };

    const response = await request(app)
      .post("/v1/contas")
      .send(banco)
      .expect(201)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      id: response.body.id,
      conta_padrao: true,
      criado_em: response.body.criado_em,
      atualizado_em: response.body.atualizado_em,
      nome: "BANCO NOVO",
      saldo_inicial: 1000.45,
      saldo_atual: 1000.45,
      status: true,
    });
  });
  test("Com valor inicial negativo", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const banco = {
      nome: "BANCO NoVO",
      saldo_inicial: -1000.45,
    };

    const response = await request(app)
      .post("/v1/contas")
      .send(banco)
      .expect(400)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      acao: "Verifique os dados enviados e tente novamente.",
      mensagem:
        "Não conseguimos validar os dados enviados, verifique os campos.",
      nome: "Erro na Requisição",
      statusCode: 400,
    });
  });
  test("Tentativa de criar uma conta padrão um uma ja existente", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    await orchestrator.createConta({
      nome: "TESTE",
      saldo_inicial: 0,
      conta_padrao: true,
    });
    const banco = {
      nome: "BANCO NoVO",
      conta_padrao: true,
      saldo_inicial: 1000.45,
    };

    const response = await request(app)
      .post("/v1/contas")
      .send(banco)
      .expect(409)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      acao: "Refaça a operação, caso persista contate um administrador.",
      mensagem:
        "Não é possivel criar a conta. Já existe uma conta padrão definida.",
      nome: "ConflictError",
      statusCode: 409,
    });
  });
  test("Com token JWT valido e usuario inexistente", async () => {
    const token = gerarToken({ nome: "luis" });

    const response = await request(app)
      .post("/v1/contas")
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
      .post("/v1/contas")
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
      .post("/v1/contas")
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
      .post("/v1/contas")

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
