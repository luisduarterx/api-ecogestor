import request from "supertest";
import { app } from "../../app";
import { test, beforeEach, expect, describe } from "vitest";
import orchestrator from "../orchestrator";
import { gerarToken } from "../../services/jwt";

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

describe("GET /v1/usuarios", () => {
  test("Deve trazer todos os resultados", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const user1 = await orchestrator.createUserWithoutPermission({
      nome: "TESTADOR 1",
    });
    const user2 = await orchestrator.createUserWithoutPermission({
      nome: "TESTADOR 2",
    });
    const user3 = await orchestrator.createUserWithoutPermission({
      nome: "TESTADOR 3",
    });

    const response = await request(app)
      .get("/v1/usuarios/")
      .expect(200)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(4);
  });

  test("Com token JWT valido e usuario inexistente", async () => {
    const token = gerarToken({ nome: "luis" });

    const response = await request(app)
      .get("/v1/usuarios/")
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
      .get("/v1/usuarios")
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
      .get("/v1/usuarios/")
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
      .get("/v1/usuarios/")

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
