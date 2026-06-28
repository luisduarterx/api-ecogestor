import request from "supertest";
import { app } from "../../../app";
import { test, beforeEach, expect, describe } from "vitest";
import orchestrator from "../../orchestrator";
import { gerarToken } from "../../../services/jwt";
import categoria from "../../../model/categorias";

beforeEach(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.createDefaultTable();
});

describe("GET to /v1/materiais/:id", async () => {
  test("Deve retornar um material válido", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const cat = await orchestrator.createCatMaterial({ nome: "CAT1" });

    const mat = await orchestrator.createMaterial({
      nome: "MATERIAL 4",
      catID: cat.id,
    });

    const response = await request(app)
      .get(`/v1/materiais/${mat.id}`)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toEqual({
      id: mat.id,
      status: true,
      nome: mat.nome,
      preco_compra: mat.preco_compra,
      preco_venda: mat.preco_venda,
      editado_em: response.body.editado_em,
      categoria: {
        id: cat.id,
        nome: cat.nome,
      },
    });
  });
  test("Com id inexistente", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const response = await request(app)
      .get(`/v1/materiais/989987`)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(404);

    expect(response.body).toEqual({
      acao: "Verifique os dados e tente novamente.",
      mensagem: "Não foi encontrado nenhum registro.",
      nome: "NotFoundError",
      statusCode: 404,
    });
  });
  test("Com id invalido", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const response = await request(app)
      .get(`/v1/materiais/invalid-id`)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toEqual({
      acao: "Verifique os dados enviados e tente novamente.",
      mensagem:
        "Não conseguimos validar os dados enviados, verifique os campos.",
      nome: "Erro na Requisição",
      statusCode: 400,
    });
  });
  test("Com token JWT invalido", async () => {
    const response = await request(app)
      .get("/v1/materiais")
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
      .get("/v1/materiais")
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
      .get("/v1/materiais")

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
