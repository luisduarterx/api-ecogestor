import request from "supertest";
import { app } from "../../../app";
import { test, beforeEach, expect, describe } from "vitest";
import orchestrator from "../../orchestrator";
import { gerarToken } from "../../../services/jwt";

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

describe("PATCH /v1/usuarios/[id]/", () => {
  test("Com id válido, nome válido", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const cargoNovo = await orchestrator.createCargo({
      nome: "NOVO CARGO",
      permissoes: [],
    });
    const user1 = await orchestrator.createUserWithoutPermission({
      nome: "TESTADOR",
      email: "testador@Test.com",
    });
    console.log("ANTIGO", user1);
    const response = await request(app)
      .patch(`/v1/usuarios/${user1.id}`)
      .send({ nome: "NOME NOVO", cargoID: cargoNovo.id })
      .expect(200)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    console.log("ATT", response.body);
    expect(response.body).toEqual({
      id: user1.id,
      nome: "NOME NOVO",
      email: "testador@test.com",
      cargo: {
        id: cargoNovo.id,
        nome: cargoNovo.nome,
      },
      telefone: response.body.telefone,
    });
  });
  test("Com id válido e email existente", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const cargoNovo = await orchestrator.createCargo({
      nome: "NOVO CARGO",
      permissoes: [],
    });
    const user1 = await orchestrator.createUserWithoutPermission({
      nome: "TESTADOR",
      email: "testador@Test.com",
    });
    const user2 = await orchestrator.createUserWithoutPermission({
      nome: "TESTADOR 2",
      email: "emailExistente@Test.com",
    });
    console.log("ANTIGO", user1);
    const response = await request(app)
      .patch(`/v1/usuarios/${user1.id}`)
      .send({
        nome: "NOME NOVO",
        cargoID: cargoNovo.id,
        email: "emailexistente@test.com",
      })
      .expect(400)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    console.log("ATT", response.body);
    expect(response.body).toEqual({
      nome: "ValidationError",
      mensagem: "Esse email já está sendo utilizado por outro usuário.",
      acao: "Verifique os dados e tente novamente, caso persista, contate um administrador.",
      statusCode: 400,
    });
  });
  test("Com id inválido", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const response = await request(app)
      .patch("/v1/usuarios/9999123")
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
      .patch("/v1/usuarios/2")
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
      .patch("/v1/usuarios/1")
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
      .patch("/v1/usuarios/2")
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
      .patch("/v1/usuarios/1")
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
