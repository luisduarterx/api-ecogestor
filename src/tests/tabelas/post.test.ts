import request from "supertest";
import { app } from "../../app";
import { test, beforeEach, expect, describe } from "vitest";
import orchestrator from "../orchestrator";
import { gerarToken } from "../../services/jwt";
import { TableInput } from "../../model/tabela";
import { Prisma } from "../../../generated/prisma/client";

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

describe("POST /v1/tabelas", () => {
  test("Deve criar uma tabela, sem materiais adicionados", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const tabela = {
      nome: "TABELa 1",
    };

    const response = await request(app)
      .post("/v1/tabelas")
      .send(tabela)
      .expect(201)
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
  test("Deve criar uma tabela, com materiais adicionados", async () => {
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
    const tabela: TableInput = {
      nome: "TABELa 1",
      materiais: [
        { id: m1.id, preco_compra: 25.5 },
        { id: m2.id, preco_compra: 100.47 },
      ],
    };

    const response = await request(app)
      .post("/v1/tabelas")
      .send(tabela)
      .expect(201)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    expect(response.body).toMatchObject({
      id: expect.any(Number),
      nome: "TABELA 1",
      padrao: false,
      materiais: expect.any(Array),
    });

    expect(response.body.materiais.length).toEqual(2);
  });
  test("Deve criar uma tabela padrão", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const tabela = {
      nome: "TABELa 1",
      padrao: true,
    };

    const response = await request(app)
      .post("/v1/tabelas")
      .send(tabela)
      .expect(201)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      id: response.body.id,
      nome: "TABELA 1",
      padrao: true,
      updatedAt: response.body.updatedAt,
      materiais: [],
    });
  });
  test("Tenta criar uma tabela padrão com uma já existente", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    await orchestrator.createDefaultTable();

    const tabela: TableInput = {
      nome: "TABELa 1",
      padrao: true,
    };

    const response = await request(app)
      .post("/v1/tabelas")
      .send(tabela)
      .expect(409)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      acao: "Refaça a operação, caso persista contate um administrador.",
      mensagem:
        "Não foi possivel criar a tabela. Já existe uma tabela padrão definida.",
      nome: "ConflictError",
      statusCode: 409,
    });
  });

  test("Com token JWT valido e usuario inexistente", async () => {
    const token = gerarToken({ nome: "luis" });

    const response = await request(app)
      .post("/v1/tabelas")
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
      .post("/v1/tabelas")
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
      .post("/v1/tabelas")
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
      .post("/v1/tabelas")

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
