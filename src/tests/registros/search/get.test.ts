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

describe("GET to /v1/registros/search", async () => {
  test("Deve retornar registros válidos", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const reg1 = await orchestrator.createRegistro({
      cpf: "13534567876",
      nome: "TESTADOR1",
      tipo: "FISICA",
    });
    const reg2 = await orchestrator.createRegistro({
      cpf: "13534567877",
      nome: "HENRIQUE LUIS",
      tipo: "FISICA",
    });
    const reg3 = await orchestrator.createRegistro({
      cpf: "13534567878",
      nome: "TESTADOR3",
      tipo: "FISICA",
    });
    const reg4 = await orchestrator.createRegistro({
      cpf: "13534567879",
      nome: "LUIS CARLOS",
      tipo: "FISICA",
    });
    const reg5 = await orchestrator.createRegistro({
      cnpj: "43736058000157",
      nome: "TESTADOR5",
      tipo: "JURIDICA",
    });
    const response = await request(app)
      .get("/v1/registros/search?&take=3&search=135")
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(200);
    for (const registro of response.body) {
      expect(registro).toMatchObject({
        id: expect.any(Number),
        nome: expect.any(String),
        tabelaID: expect.any(Number),
        tipo: expect.stringMatching(/FISICA|JURIDICA/),
        documento: expect.any(String),
      });
    }
  });

  test("Com token JWT invalido", async () => {
    const response = await request(app)
      .get("/v1/registros")
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
      .get("/v1/registros")
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
      .get("/v1/registros")

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
