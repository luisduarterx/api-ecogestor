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

describe("DELETE to /v1/registros/[id]", async () => {
  test("Deve deletar um registro válido", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const reg = await orchestrator.createRegistro({
      cnpj: "43736058000157",
      nome: "TESTADOR",
      tipo: "JURIDICA",
    });

    const response = await request(app)
      .delete(`/v1/registros/${reg.id}`)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toEqual({
      id: reg.id,
      deleted_at: response.body.deleted_at,
    });
    expect(response.body.deleted_at).toEqual(expect.any(String));
    expect(Date.parse(response.body.deleted_at)).not.toBeNaN();
  });
  test("Com id inexistente", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const response = await request(app)
      .delete(`/v1/registros/998733`)
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
      .delete(`/v1/registros/invalid-id`)
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
      .delete("/v1/registros/12")
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
      .delete("/v1/registros/12")
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
      .delete("/v1/registros/12")

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
