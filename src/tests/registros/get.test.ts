import request from "supertest";
import { app } from "../../app";
import { test, beforeEach, expect, describe } from "vitest";
import orchestrator from "../orchestrator";
import { gerarToken } from "../../services/jwt";
import { RegistroCreateInput } from "../../types/registros";

beforeEach(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.createDefaultTable();
});

describe("GET to /v1/registros/", async () => {
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
      .get("/v1/registros?page=1&take=10")
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(200);
    console.log(response.body);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(5);
    for (const registro of response.body) {
      expect(registro).toMatchObject({
        id: expect.any(Number),
        nome: expect.any(String),
        tabela: expect.any(String),
        tipo: expect.stringMatching(/FISICA|JURIDICA/),
        documento: expect.any(String),
      });
      expect(registro.criado_em).toEqual(expect.any(String));
      expect(Date.parse(registro.criado_em)).not.toBeNaN();
    }
  });
  test("Deve retornar registros válidos, com filtro", async () => {
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
      .get("/v1/registros?page=1&take=10&search=lu")
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(200);
    console.log(response.body);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
    for (const registro of response.body) {
      expect(registro).toMatchObject({
        id: expect.any(Number),
        nome: expect.any(String),
        tabela: expect.any(String),
        tipo: expect.stringMatching(/FISICA|JURIDICA/),
        documento: expect.any(String),
      });
      expect(registro.criado_em).toEqual(expect.any(String));
      expect(Date.parse(registro.criado_em)).not.toBeNaN();
    }
  });
  test("Deve retornar registros válidos, por busca por cpf", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const reg1 = await orchestrator.createRegistro({
      cpf: "13534567876",
      nome: "TESTADOR1",
      tipo: "FISICA",
    });
    const reg2 = await orchestrator.createRegistro({
      cpf: "13575249784",
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
      .get("/v1/registros?page=1&take=10&search=13575")
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(200);
    console.log(response.body);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0].nome).toEqual("HENRIQUE LUIS");
  });
  test("Deve retornar registros válidos, por busca por CNPJ", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const reg1 = await orchestrator.createRegistro({
      cpf: "13534567876",
      nome: "TESTADOR1",
      tipo: "FISICA",
    });
    const reg2 = await orchestrator.createRegistro({
      cpf: "13575249784",
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
      nome: "EMPRESA",
      tipo: "JURIDICA",
    });
    const response = await request(app)
      .get("/v1/registros?page=1&take=10&search=437")
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(200);
    console.log(response.body);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0].nome).toEqual("EMPRESA");
  });
  test("Deve retornar registros válidos, com filtro sem combinaçao", async () => {
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
      .get("/v1/registros?page=1&take=10&search=lu!")
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(200);
    console.log(response.body);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(0);
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
