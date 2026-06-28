import request from "supertest";
import { app } from "../../app";
import { test, beforeEach, expect, describe } from "vitest";
import orchestrator from "../orchestrator";
import { gerarToken } from "../../services/jwt";

beforeEach(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.createDefaultTable();
});

describe("POST to /v1/materiais", async () => {
  test("Deve retornar um material válido.", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const cat = await orchestrator.createCatMaterial({ nome: "CAT DE TESTE" });
    const material = {
      nome: "MATERIaL DE TESTE",
      catID: cat.id,
      preco_venda: 12.99,
      preco_compra: 9.98,
    };
    const response = await request(app)
      .post("/v1/materiais")
      .send(material)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(201);

    expect(response.body).toEqual({
      id: response.body.id,
      nome: "MATERIAL DE TESTE",
      categoria: {
        id: cat.id,
        nome: cat.nome,
      },
      preco_compra: 9.98,
      preco_venda: 12.99,
      status: true,
      criado_em: response.body.criado_em,
      editado_em: response.body.editado_em,
    });

    expect(Date.parse(response.body.criado_em)).not.toBeNaN();
    expect(Date.parse(response.body.editado_em)).not.toBeNaN();
  });
  test("Não deve ser possivel criar um material duplicado", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const cat = await orchestrator.createCatMaterial({ nome: "CAT DE TESTE" });
    await orchestrator.createMaterial({
      nome: "MATERIAL DE TEsTE",
      catID: cat.id,
    });
    const material = {
      nome: "MATERIaL DE TESTE",
      catID: cat.id,
      preco_venda: 12.99,
      preco_compra: 9.98,
    };
    const response = await request(app)
      .post("/v1/materiais")
      .send(material)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toEqual({
      nome: "ValidationError",
      mensagem: "Não é possivel criar um material com o nome duplicado.",
      acao: "Verifique os dados e tente novamente, caso persista, contate um administrador.",
      statusCode: 400,
    });
  });
  test("Não deve ser possivel criar um material com nome inválido", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const cat = await orchestrator.createCatMaterial({ nome: "CAT DE TESTE" });

    const material = {
      nome: "MA",
      catID: cat.id,
      preco_venda: 12.99,
      preco_compra: 9.98,
    };
    const response = await request(app)
      .post("/v1/materiais")
      .send(material)
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
  test("Não deve ser possivel criar um material com preço negativo", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const cat = await orchestrator.createCatMaterial({ nome: "CAT DE TESTE" });

    const material = {
      nome: "MATERIAL",
      catID: cat.id,
      preco_venda: -12.99,
      preco_compra: -9.98,
    };
    const response = await request(app)
      .post("/v1/materiais")
      .send(material)
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
  test("Não deve ser possivel criar um material com categoria inexistente", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const material = {
      nome: "MATERIaL DE TESTE",
      catID: 9474,
      preco_venda: 12.99,
      preco_compra: 9.98,
    };
    const response = await request(app)
      .post("/v1/materiais")
      .send(material)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toEqual({
      nome: "ValidationError",
      mensagem: "Um erro de validação ocorreu ao processar a operação.",
      acao: "Verifique os dados e tente novamente, caso persista, contate um administrador.",
      statusCode: 400,
    });
  });
  test("Com token JWT invalido", async () => {
    const response = await request(app)
      .post("/v1/materiais")
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
      .post("/v1/materiais")
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
      .post("/v1/materiais")

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
