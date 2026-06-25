import request from "supertest";
import { app } from "../../app";
import { test, beforeEach, expect, describe } from "vitest";
import orchestrator from "../orchestrator";
import { gerarToken } from "../../services/jwt";

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

describe("GET /v1/cargos/[id]/", () => {
  test("Deve trazer todos os resultados", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const p = await orchestrator.findPermissions();

    await orchestrator.createCargo({
      nome: "CARGO 1",
      permissoes: [p[0].id, p[1].id, p[2].id],
    });
    await orchestrator.createCargo({
      nome: "CARGO 2",
      permissoes: [p[1].id],
    });
    await orchestrator.createCargo({
      nome: "CARGO 3",
      permissoes: [p[3].id, p[4].id],
    });

    const response = await request(app)
      .get("/v1/cargos/")
      .expect(200)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(4);
  });
  test("Deve trazer todos os resultados", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const p = await orchestrator.findPermissions();

    await orchestrator.createCargo({
      nome: "RANK 1",
      permissoes: [p[0].id, p[1].id, p[2].id],
    });
    await orchestrator.createCargo({
      nome: "rank 2",
      permissoes: [p[1].id],
    });
    await orchestrator.createCargo({
      nome: "CARGO 3",
      permissoes: [p[3].id, p[4].id],
    });

    const response = await request(app)
      .get("/v1/cargos?search=cargo")
      .expect(200)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toEqual({
      id: response.body[0].id,
      nome: "CARGO 3",
      descricao: response.body[0].descricao,
      permissoes: response.body[0].permissoes,
    });
  });

  test("Com token JWT valido e usuario inexistente", async () => {
    const token = gerarToken({ nome: "luis" });

    const response = await request(app)
      .get("/v1/cargos/")
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
      .get("/v1/cargos/1")
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
      .get("/v1/cargos/")
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
