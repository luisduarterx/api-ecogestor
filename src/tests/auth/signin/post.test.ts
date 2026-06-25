import request from "supertest";
import { app } from "../../../app";
import { test, beforeEach, expect, describe } from "vitest";
import orchestrator from "../../orchestrator";

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

describe("POST /v1/auth/sigin", () => {
  test("Com dados validos.", async () => {
    const user = await orchestrator.createUserWithoutPermission({
      nome: "Luis",

      senha: "1234",
    });

    const response = await request(app)
      .post("/v1/auth/signin")
      .send({
        email: user.email,
        senha: "1234",
      })
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      user: {
        id: user.id,
        nome: "Luis",
        email: user.email,
        cargo: response.body.user.cargo,
      },
      token: response.body.token,
    });
  });

  test("Com email correto e senha incorreta.", async () => {
    const user = await orchestrator.createUserWithoutPermission({
      nome: "Luis",

      senha: "1234",
    });

    const response = await request(app)
      .post("/v1/auth/signin")
      .send({
        email: user.email,
        senha: "123",
      })
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      nome: "Usuario não Encontrado",
      mensagem: "Não foi encontrado nenhum usuario.",
      acao: "Verifique os dados e tente novamente",
      statusCode: 401,
    });
  });
  test("Com email incorreto e senha correta.", async () => {
    const user = await orchestrator.createUserWithoutPermission({
      nome: "Luis",

      senha: "1234",
    });

    const response = await request(app)
      .post("/v1/auth/signin")
      .send({
        email: "teste@gmail.com",
        senha: "1234",
      })
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      nome: "Usuario não Encontrado",
      mensagem: "Não foi encontrado nenhum usuario.",
      acao: "Verifique os dados e tente novamente",
      statusCode: 401,
    });
  });
  test("Com dados incorretos", async () => {
    const response = await request(app)
      .post("/v1/auth/signin")
      .send({
        email: "admin@admin.com",
        senha: "1234",
      })
      .expect("Content-Type", /json/)
      .expect(401);
    expect(response.body).toEqual({
      nome: "Usuario não Encontrado",
      mensagem: "Não foi encontrado nenhum usuario.",
      acao: "Verifique os dados e tente novamente",
      statusCode: 401,
    });
  });
  test("Sem body na requisição", async () => {
    const response = await request(app)
      .post("/v1/auth/signin")

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
});
