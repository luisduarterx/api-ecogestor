import request from "supertest";
import { app } from "../../../app";
import { test, beforeEach, expect, describe } from "vitest";
import orchestrator from "../../orchestrator";
import { gerarToken } from "../../../services/jwt";
import { TableInput } from "../../../model/tabela";

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

describe("GET /v1/tabelas/[id]/", () => {
  test("Com id válido, sem materiais", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const t1 = await orchestrator.createTabela({ nome: "TABELA 1" });

    const response = await request(app)
      .get(`/v1/tabelas/${t1.id}`)
      .expect(200)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      id: response.body.id,
      nome: "TABELA 1",
      padrao: false,
      updatedAt: response.body.updatedAt,
      materiais: [],
    });
  });
  test("Com id válido, com materiais", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    await orchestrator.createDefaultTable();
    const cat = await orchestrator.createCatMaterial({ nome: "CAT1" });
    const m1 = await orchestrator.createMaterial({
      nome: "Material 1",
      catID: cat.id,
    });
    const m2 = await orchestrator.createMaterial({
      nome: "Material 2",
      catID: cat.id,
    });
    const m3 = await orchestrator.createMaterial({
      nome: "Material 3",
      catID: cat.id,
    });
    const t1 = await orchestrator.createTabela({
      nome: "TABELa 1",
      materiais: [
        { id: m1.id, preco_compra: 25.5 },
        { id: m2.id, preco_compra: 100.47 },
      ],
    });

    const response = await request(app)
      .get(`/v1/tabelas/${t1.id}`)
      .expect(200)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    expect(response.body).toMatchObject({
      id: expect.any(Number),
      nome: "TABELA 1",
      padrao: false,
      materiais: expect.any(Array),
    });
  });

  test("Com id inexistente", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const response = await request(app)
      .get("/v1/tabelas/9999123")
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(404);

    expect(response.body).toEqual({
      nome: "NotFoundError",
      mensagem: "Não foi encontrado nenhum registro.",
      acao: "Verifique os dados e tente novamente.",
      statusCode: 404,
    });
  });
  test("Com token JWT valido e usuario inexistente", async () => {
    const token = gerarToken({ nome: "luis" });

    const response = await request(app)
      .get("/v1/tabelas/2")
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
      .get("/v1/tabelas/1")
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
      .get("/v1/tabelas/2")
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
      .get("/v1/tabelas/1")

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
