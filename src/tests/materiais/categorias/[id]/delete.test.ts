import request from "supertest";
import { app } from "../../../../app";
import { test, beforeEach, expect, describe } from "vitest";
import orchestrator from "../../../orchestrator";
import { gerarToken } from "../../../../services/jwt";
import { prisma } from "../../../../libs/prisma";

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

describe("PATCH to /v1/materiais/categorias/:id", async () => {
  test("Com dados válidos", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const categoria = await orchestrator.createCatMaterial({ nome: "CAT1" });

    const response = await request(app)
      .delete(`/v1/materiais/categorias/${categoria.id}`)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(200);

    console.log(response.text);

    expect(response.body).toEqual({
      id: categoria.id,
      count: 1,
    });
  });
  test("Com materiais atrelados a categoria", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const categoria = await orchestrator.createCatMaterial({ nome: "CAT1" });
    await prisma.material.create({
      data: {
        nome: "TESTE",
        catID: categoria.id,
        v_venda: 10,
        estoque: 0,
      },
    });

    const response = await request(app)
      .delete(`/v1/materiais/categorias/${categoria.id}`)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(400);

    console.log(response.text);

    expect(response.body).toEqual({
      nome: "ValidationError",
      mensagem:
        "Não é possivel deletar uma categoria com materiais associados.",
      acao: "Verifique os dados e tente novamente, caso persista, contate um administrador.",
      statusCode: 400,
    });
  });
  test("Com id inexistente", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const response = await request(app)
      .delete("/v1/materiais/categorias/99999")
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
      .delete("/v1/materiais/categorias/invalid-id")
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

  test("Com token JWT invalido", async () => {
    const response = await request(app)
      .delete("/v1/materiais/categorias/987")
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
      .delete("/v1/materiais/categorias/98")
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
      .delete("/v1/materiais/categorias/99")

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
