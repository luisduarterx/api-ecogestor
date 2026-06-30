import request from "supertest";
import { app } from "../../../app";
import { test, beforeEach, expect, describe } from "vitest";
import orchestrator from "../../orchestrator";
import { gerarToken } from "../../../services/jwt";
import { RegistroCreateInput } from "../../../types/registros";

beforeEach(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.createDefaultTable();
});

describe("PATCH to /v1/registros/[id]", async () => {
  test("Deve retornar um registro válido, atualizado", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const reg = await orchestrator.createRegistro({
      cnpj: "43736058000157",
      nome: "TESTADOR",
      tipo: "JURIDICA",
    });

    const response = await request(app)
      .patch(`/v1/registros/${reg.id}`)
      .auth(user.jwt, { type: "bearer" })
      .send({
        nome: "ALTERADO",
      })
      .expect("Content-Type", /json/)
      .expect(200);
    console.log(response.body);

    expect(response.body.nome_razao).toEqual("ALTERADO");
  });
  test("Deve retornar um registro válido com atualização de CNPJ", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const reg = await orchestrator.createRegistro({
      cnpj: "43736058000157",
      nome: "TESTADOR",
      tipo: "JURIDICA",
    });

    const response = await request(app)
      .patch(`/v1/registros/${reg.id}`)
      .auth(user.jwt, { type: "bearer" })
      .send({
        juridica: {
          cnpj: "14658625000187",
        },
      })
      .expect("Content-Type", /json/)
      .expect(200);
    console.log(response.body);

    expect(response.body.juridica.cnpj).toEqual("14658625000187");
  });
  test("Deve retornar um registro válido com atualização dados de pagamento", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const reg = await orchestrator.createRegistro({
      cnpj: "43736058000157",
      nome: "TESTADOR",
      tipo: "JURIDICA",
    });

    const response = await request(app)
      .patch(`/v1/registros/${reg.id}`)
      .auth(user.jwt, { type: "bearer" })
      .send({
        pagamento: {
          pix: "135752",
        },
      })
      .expect("Content-Type", /json/)
      .expect(200);
    console.log(response.body);

    expect(response.body.dados_pagamento.chave).toEqual("135752");
  });
  test("Deve retornar um registro válido com atualização endereço", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const reg = await orchestrator.createRegistro({
      cnpj: "43736058000157",
      nome: "TESTADOR",
      tipo: "JURIDICA",
    });

    const response = await request(app)
      .patch(`/v1/registros/${reg.id}`)
      .auth(user.jwt, { type: "bearer" })
      .send({
        endereco: {
          logradouro: "TESTE",
        },
      })
      .expect("Content-Type", /json/)
      .expect(200);
    console.log(response.body);

    expect(response.body.endereco.logradouro).toEqual("TESTE");
  });
  test("Com id inexistente", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const response = await request(app)
      .patch(`/v1/registros/998733`)
      .auth(user.jwt, { type: "bearer" })
      .send({})
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
      .patch(`/v1/registros/invalid-id`)
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
      .patch("/v1/registros/12")
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
      .patch("/v1/registros/12")
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
      .patch("/v1/registros/12")

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
