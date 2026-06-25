import request from "supertest";
import { app } from "../../app";
import { test, beforeEach, expect, describe } from "vitest";
import orchestrator from "../orchestrator";
import { gerarToken } from "../../services/jwt";

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

describe("POST /v1/usuarios", () => {
  test("Com dados válidos", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const cargo = await orchestrator.createCargo({
      nome: "CARGO AUX",
      permissoes: [],
    });
    const usuario = {
      nome: "USUARIO TESTE",
      email: "TEST@TEST.COM",
      senha: "1234",
      cargoID: cargo.id,
    };

    const response = await request(app)
      .post("/v1/usuarios")
      .send(usuario)
      .expect(201)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    console.log(response.body);

    expect(response.body).toEqual({
      id: response.body.id,
      nome: "USUARIO TESTE",
      email: "test@test.com",
      telefone: response.body.telefone,
      cargo: {
        id: cargo.id,
        nome: cargo.nome,
      },
    });
  });
  test("Com email já existente", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
      email: "test@test.com",
    });

    const usuario = {
      nome: "USUARIO TESTE",
      email: "TEST@TEST.COM",
      senha: "1234",
      cargoID: 99087,
    };

    const response = await request(app)
      .post("/v1/usuarios")
      .send(usuario)
      .expect(400)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    console.log(response.body);

    expect(response.body).toEqual({
      nome: "ValidationError",
      mensagem: "Um erro de validação ocorreu ao processar a operação.",
      acao: "Verifique os dados e tente novamente, caso persista, contate um administrador.",
      statusCode: 400,
    });
  });
  test("Com dados válidos e cargo inválido", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const usuario = {
      nome: "USUARIO TESTE",
      email: "TEST@TEST.COM",
      senha: "1234",
      cargoID: 99087,
    };

    const response = await request(app)
      .post("/v1/usuarios")
      .send(usuario)
      .expect(400)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    console.log(response.body);

    expect(response.body).toEqual({
      nome: "ValidationError",
      mensagem: "Um erro de validação ocorreu ao processar a operação.",
      acao: "Verifique os dados e tente novamente, caso persista, contate um administrador.",
      statusCode: 400,
    });
  });
  test("Com dados invalidos", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const usuario = {
      nome: "USUARIO TESTE",
      email: "TEST@TEST.COM",
      cargoID: 99087,
    };

    const response = await request(app)
      .post("/v1/usuarios")
      .send(usuario)
      .expect(400)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    console.log(response.body);

    expect(response.body).toEqual({
      nome: "Erro na Requisição",
      mensagem:
        "Não conseguimos validar os dados enviados, verifique os campos.",
      acao: "Verifique os dados enviados e tente novamente.",
      statusCode: 400,
    });
  });

  test("Com token JWT valido e usuario inexistente", async () => {
    const token = gerarToken({ nome: "luis" });

    const response = await request(app)
      .post("/v1/usuarios")
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
      .post("/v1/usuarios")
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
      .post("/v1/usuarios")
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
      .post("/v1/usuarios")

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
