import request from "supertest";
import { app } from "../../../app";
import { test, beforeEach, expect, describe } from "vitest";
import orchestrator from "../../orchestrator";
import { gerarToken } from "../../../services/jwt";
import { prisma } from "../../../libs/prisma";

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

describe("DELETE /v1/cargos/[id]/", () => {
  test("Com id válido, nome válido", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const cargo = await orchestrator.createCargo({
      nome: "CARGO NOVO",
      permissoes: [],
    });

    const response = await request(app)
      .delete(`/v1/cargos/${cargo.id}`)
      .expect(200)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      deletado: 1,
    });
  });
  test("Com usuário utilizando cargo", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const cargo = await orchestrator.createCargo({
      nome: "CARGO NOVO",
      permissoes: [],
    });
    await prisma.user.create({
      data: {
        nome: "TESTADOR",
        email: "teste@test.com",
        senha: "1234",
        cargoID: cargo.id,
      },
    });

    const response = await request(app)
      .delete(`/v1/cargos/${cargo.id}`)
      .expect(400)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      nome: "ValidationError",
      mensagem: "Não é possível deletar um cargo que está sendo utilizado.",
      acao: "Verifique os dados e tente novamente, caso persista, contate um administrador.",
      statusCode: 400,
    });
  });

  test("Com id inválido", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const response = await request(app)
      .delete("/v1/cargos/9999123")
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
      .delete("/v1/cargos/2")
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
      .delete("/v1/cargos/1")
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
      .delete("/v1/cargos/2")
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
      .delete("/v1/cargos/1")
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
