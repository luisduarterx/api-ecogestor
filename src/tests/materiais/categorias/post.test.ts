import request from "supertest";
import { app } from "../../../app";
import { test, beforeEach, expect, describe } from "vitest";
import orchestrator from "../../orchestrator";
import { gerarToken } from "../../../services/jwt";

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

describe("POST to /v1/materiais/categorias", async () => {
  test("Com dados válidos", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const categoria = {
      nome: "PLASTICOS",
    };

    const response = await request(app)
      .post("/v1/materiais/categorias")
      .send(categoria)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(201);

    expect(response.body).toEqual({
      id: response.body.id,
      nome: "PLASTICOS",
    });
  });
  test("Com nome inválido", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const categoria = {
      nome: "PLASTIC@OS",
    };

    const response = await request(app)
      .post("/v1/materiais/categorias")
      .send(categoria)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toEqual({
      nome: "Erro na Requisição",
      mensagem:
        "Não conseguimos validar os dados enviados, verifique os campos.",
      acao: "Verifique os dados enviados e tente novamente.",
      statusCode: 400,
    });
  });

  test("Com nome duplicado", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    await orchestrator.createCatMaterial({ nome: "CAT1" });

    const categoria = {
      nome: "CAT1",
    };

    const response = await request(app)
      .post("/v1/materiais/categorias")
      .send(categoria)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toEqual({
      nome: "ValidationError",
      mensagem: "Já existe uma categoria com esse nome cadastrado.",
      acao: "Verifique os dados e tente novamente, caso persista, contate um administrador.",
      statusCode: 400,
    });
  });
  test("Com token JWT invalido", async () => {
    const response = await request(app)
      .post("/v1/materiais/categorias")
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
      .post("/v1/materiais/categorias")
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
      .post("/v1/materiais/categorias")

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
