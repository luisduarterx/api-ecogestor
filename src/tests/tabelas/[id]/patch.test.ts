import request from "supertest";
import { app } from "../../../app";
import { test, beforeEach, expect, describe } from "vitest";
import orchestrator from "../../orchestrator";
import { gerarToken } from "../../../services/jwt";

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

describe("PATCH /v1/tabelas/[id]/", () => {
  test("Deve atualizar nome de uma tabela", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const t1 = await orchestrator.createTabela({ nome: "TABELA 1" });

    const response = await request(app)
      .patch(`/v1/tabelas/${t1.id}`)
      .send({ nome: "NOME NoVO" })
      .expect(200)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      id: response.body.id,
      nome: "NOME NOVO",
      padrao: false,
      updatedAt: response.body.updatedAt,
      materiais: [],
    });
  });
  test("Deve atualizar somente os materiais da tabela", async () => {
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
      .patch(`/v1/tabelas/${t1.id}`)
      .send({
        materiais: [
          {
            id: m1.id,
            preco_compra: 80.5,
          },
          {
            id: m3.id,
            preco_compra: 7.5,
          },
        ],
      })
      .expect(200)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    expect(response.body).toMatchObject({
      id: expect.any(Number),
      nome: expect.any(String),
      updatedAt: expect.any(String),
      padrao: expect.any(Boolean),
      materiais: [
        {
          id: expect.any(Number),
          tabelaID: expect.any(Number),
          materialID: expect.any(Number),
          preco_compra: 80.5,
          editadoEm: expect.any(String),
        },
        {
          id: expect.any(Number),
          tabelaID: expect.any(Number),
          materialID: expect.any(Number),
          preco_compra: 7.5,
          editadoEm: expect.any(String),
        },
      ],
    });
  });
  test("Deve alterar tabela para padrão", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const t1 = await orchestrator.createTabela({ nome: "TABELa 1" });

    const response = await request(app)
      .patch(`/v1/tabelas/${t1.id}`)
      .send({ padrao: true })
      .expect(200)
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
  test("Tenta alterar tabela para padrão, com uma ja existente", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    await orchestrator.createDefaultTable();
    const t1 = await orchestrator.createTabela({ nome: "TABELa 1" });

    const response = await request(app)
      .patch(`/v1/tabelas/${t1.id}`)
      .send({ padrao: true })
      .expect(409)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      acao: "Refaça a operação, caso persista contate um administrador.",
      mensagem:
        "Não foi possivel editar a tabela. Já existe uma tabela padrão definida.",
      nome: "ConflictError",
      statusCode: 409,
    });
  });

  test("Com id inválido", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const response = await request(app)
      .patch("/v1/tabelas/9999123")
      .send({})
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
      .patch("/v1/tabelas/2")
      .send({})
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
      .patch("/v1/tabelas/1")
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
      .patch("/v1/tabelas/2")
      .send({})
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
      .patch("/v1/tabelas/1")
      .send({})
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
