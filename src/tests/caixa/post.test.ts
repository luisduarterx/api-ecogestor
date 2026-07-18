import request from "supertest";
import { app } from "../../app";
import { test, beforeEach, expect, describe } from "vitest";
import orchestrator from "../orchestrator";
import { gerarToken } from "../../services/jwt";
import { StatusCaixa } from "../../../generated/prisma/enums";

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

describe("POST /v1/financeiro/caixa/abrir", () => {
  test("Tenta criar um caixa, sem conta padrão definida", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const response = await request(app)
      .post("/v1/financeiro/caixa/abrir")
      .expect(409)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    console.log(response.body);

    expect(response.body).toEqual({
      acao: "Defina uma conta padrão nos parametros do sistema.",
      mensagem: "O sistema não tem uma conta padrão definida.",
      nome: "ConflictError",
      statusCode: 409,
    });
  });
  test("Deve criar um caixa aberto", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const conta = await orchestrator.createConta({
      conta_padrao: true,
      saldo_inicial: 1000,
      nome: "DINHEIRO",
    });

    const response = await request(app)
      .post("/v1/financeiro/caixa/abrir")
      .expect(201)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    console.log(response.body);

    expect(response.body).toMatchObject({
      id: expect.any(Number),
      aberto_em: expect.any(String),
      status: StatusCaixa.ABERTO,
      saldo_inicial: expect.any(Number),
      usuario_abertura_id: expect.any(Number),
      conta_id: conta.id,
    });
  });
  test("Tenta criar um caixa, com um caixa já aberto", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const conta = await orchestrator.createConta({
      conta_padrao: true,
      saldo_inicial: 1000,
      nome: "DINHEIRO",
    });

    await orchestrator.abrirCaixa({
      user_id: user.id,
      conta_id: conta.id,
      observacao: "",
    });
    const response = await request(app)
      .post("/v1/financeiro/caixa/abrir")
      .expect(409)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    console.log(response.body);

    expect(response.body).toEqual({
      acao: "Refaça a operação, caso persista contate um administrador.",
      mensagem: "Feche o caixa aberto para abrir outro novamente.",
      nome: "ConflictError",
      statusCode: 409,
    });
  });
  test("Com token JWT valido e usuario inexistente", async () => {
    const token = gerarToken({ nome: "luis" });

    const response = await request(app)
      .post("/v1/financeiro/caixa/abrir")
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
      .post("/v1/financeiro/caixa/abrir")
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
      .post("/v1/financeiro/caixa/abrir")
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
      .post("/v1/financeiro/caixa/abrir")

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
