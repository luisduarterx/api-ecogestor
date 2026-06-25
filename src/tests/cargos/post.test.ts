import request from "supertest";
import { app } from "../../app";
import { test, beforeEach, expect, describe } from "vitest";
import orchestrator from "../orchestrator";
import { gerarToken } from "../../services/jwt";

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

describe("POST /v1/cargos", () => {
  test("Com dados válidos, sem permissoes cadastradas", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const cargo = {
      nome: "CARGO novo",
      permissoes: [],
    };

    const response = await request(app)
      .post("/v1/cargos")
      .send(cargo)
      .expect(201)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    console.log(response.body);

    expect(response.body).toEqual({
      id: response.body.id,
      nome: "CARGO NOVO",
      permissoes: cargo.permissoes,
    });
  });
  test("Com dados válidos, com permissoes cadastradas válidas", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const permissoes = await orchestrator.findPermissions();
    const cargo = {
      nome: "cargo novo",
      permissoes: permissoes.map((item) => item.id),
    };

    const response = await request(app)
      .post("/v1/cargos")
      .send(cargo)
      .expect(201)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    console.log(response.body);

    expect(response.body).toEqual({
      id: response.body.id,
      nome: "CARGO NOVO",
      permissoes: response.body.permissoes,
    });
    expect(response.body.permissoes.length).toBeGreaterThan(0);
  });
  test("Com dados válidos, com permissoes cadastradas inválidas", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const cargo = {
      nome: "CARGO NOVO",
      permissoes: [999, 9995, 94563],
    };

    const response = await request(app)
      .post("/v1/cargos")
      .send(cargo)
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
  test("Com token JWT valido e usuario inexistente", async () => {
    const token = gerarToken({ nome: "luis" });

    const response = await request(app)
      .post("/v1/cargos")
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
      .post("/v1/cargos")
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
      .post("/v1/cargos")
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
      .post("/v1/cargos")

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
