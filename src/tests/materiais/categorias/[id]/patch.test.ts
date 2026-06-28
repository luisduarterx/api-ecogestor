import request from "supertest";
import { app } from "../../../../app";
import { test, beforeEach, expect, describe } from "vitest";
import orchestrator from "../../../orchestrator";
import { gerarToken } from "../../../../services/jwt";

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

describe("PATCH to /v1/materiais/categorias/:id", async () => {
  test("Com dados unicos e válidos", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const categoria = await orchestrator.createCatMaterial({ nome: "CAT1" });

    const response = await request(app)
      .patch(`/v1/materiais/categorias/${categoria.id}`)
      .auth(user.jwt, { type: "bearer" })
      .send({ nome: "CAT1 ATUALIZADA" });

    console.log(response.text);

    expect(response.body).toEqual({
      id: categoria.id,
      nome: "CAT1 ATUALIZADA",
    });
  });
  test("Com id inexistente", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const response = await request(app)
      .patch("/v1/materiais/categorias/99999")
      .send({ nome: "TESTE" })
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
  test("Com id invalido", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const response = await request(app)
      .patch("/v1/materiais/categorias/invalid-id")
      .auth(user.jwt, { type: "bearer" })
      .send({ nome: "TESTE" })
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
  test("Com nome invalido", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const cat1 = await orchestrator.createCatMaterial({ nome: "TESTADOR" });

    const response = await request(app)
      .patch(`/v1/materiais/categorias/${cat1.id}`)
      .auth(user.jwt, { type: "bearer" })
      .send({ nome: "TE" })
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
  test("Com nome já utilizado", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const categoria1 = await orchestrator.createCatMaterial({ nome: "CAT1" });
    const categoria2 = await orchestrator.createCatMaterial({ nome: "CAT2" });

    const response = await request(app)
      .patch(`/v1/materiais/categorias/${categoria2.id}`)
      .auth(user.jwt, { type: "bearer" })
      .send({ nome: "CAT1" })
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toEqual({
      nome: "ValidationError",
      mensagem: "O nome dessa categoria já esta sendo utilizada.",
      acao: "Verifique os dados e tente novamente, caso persista, contate um administrador.",
      statusCode: 400,
    });
  });
  test("Com token JWT invalido", async () => {
    const response = await request(app)
      .patch("/v1/materiais/categorias/987")
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
      .patch("/v1/materiais/categorias/98")
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
      .patch("/v1/materiais/categorias/99")

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
