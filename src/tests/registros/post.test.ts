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

describe("POST to /v1/registros", async () => {
  test("Deve retornar um registro pessoa física válido, com todos os dados", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const pessoaFisicaFake: RegistroCreateInput = {
      tipo: "FISICA",
      nome: "JOAO DA SILVA",
      apelido: "JOAO",
      email: "joao.teste@email.com",
      telefone: "21999999999",
      cpf: "12345678901",
      nascimento: new Date("1998-05-20"),
      pagamento: {
        banco: "NUBANK",
        agencia: "0001",
        conta: "12345678",
        cpf: "12345678901",
        pix: "joao.teste@email.com",
      },

      endereco: {
        cep: "23000000",
        estado: "RJ",
        cidade: "RIO DE JANEIRO",
        bairro: "CAMPO GRANDE",
        logradouro: "RUA TESTE",
        numero: "123",
        complemento: "CASA 1",
      },
    };
    const response = await request(app)
      .post("/v1/registros")
      .send(pessoaFisicaFake)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(201);
    console.log(response.body);

    expect(response.body).toMatchObject({
      id: expect.any(Number),
      nome_razao: pessoaFisicaFake.nome,
      apelido: pessoaFisicaFake.apelido,
      email: pessoaFisicaFake.email,
      telefone: pessoaFisicaFake.telefone,
      tipo: "FISICA",
      tabelaID: response.body.tabelaID,

      fisica: {
        cpf: pessoaFisicaFake.cpf,
      },

      juridica: null,

      dados_pagamento: {
        banco: pessoaFisicaFake.pagamento?.banco,
        agencia: pessoaFisicaFake.pagamento?.agencia,
        conta: pessoaFisicaFake.pagamento?.conta,
        cpf: pessoaFisicaFake.pagamento?.cpf,
        chave: pessoaFisicaFake.pagamento?.pix,
      },

      endereco: {
        cep: pessoaFisicaFake.endereco?.cep,
        estado: pessoaFisicaFake.endereco?.estado,
        cidade: pessoaFisicaFake.endereco?.cidade,
        bairro: pessoaFisicaFake.endereco?.bairro,
        logradouro: pessoaFisicaFake.endereco?.logradouro,
        numero: pessoaFisicaFake.endereco?.numero,
        complemento: pessoaFisicaFake.endereco?.complemento,
      },

      saldo: {
        saldo: 0,
      },
    });
  });
  test("Deve retornar um registro pessoa física válido", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const registro = {
      nome: "LUIS CLAUDIO DUARTE ROXO",
      cpf: "13575249784",
      tipo: "FISICA",
    };
    const response = await request(app)
      .post("/v1/registros")
      .send(registro)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(201);
    console.log(response.body);

    expect(response.body).toEqual({
      apelido: null,
      criadoEm: response.body.criadoEm,
      dados_pagamento: null,
      email: null,
      endereco: null,
      fisica: {
        cpf: "13575249784",
        id: response.body.fisica.id,
        nascimento: null,
        registroID: response.body.id,
      },
      id: response.body.id,
      juridica: null,
      nome_razao: "LUIS CLAUDIO DUARTE ROXO",
      saldo: {
        id: response.body.saldo.id,
        saldo: 0,
      },
      tabelaID: response.body.tabelaID,
      telefone: null,
      tipo: "FISICA",
    });
  });
  test("Deve retornar um registro pessoa juridica válido", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const registro = {
      nome: "NOVA EMPRESA",
      cnpj: "43589568000147",
      ie: "12365478",
      tipo: "JURIDICA",
    };
    const response = await request(app)
      .post("/v1/registros")
      .send(registro)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(201);
    console.log(response.body);

    expect(response.body).toEqual({
      apelido: null,
      criadoEm: response.body.criadoEm,
      dados_pagamento: null,
      email: null,
      endereco: null,
      fisica: null,
      id: response.body.id,
      juridica: {
        id: response.body.juridica.id,
        registroID: response.body.id,
        fantasia: null,
        cnpj: "43589568000147",
        ie: "12365478",
      },
      nome_razao: "NOVA EMPRESA",
      saldo: {
        id: response.body.saldo.id,
        saldo: 0,
      },
      tabelaID: response.body.tabelaID,
      telefone: null,
      tipo: "JURIDICA",
    });
  });
  test("Com cnpj ao enviar tipo pessoa fisica", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const registro = {
      nome: "NOVA EMPRESA",
      cnpj: "43589568000147",
      tipo: "FISICA",
    };
    const response = await request(app)
      .post("/v1/registros")
      .send(registro)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(400);
    console.log(response.body);

    expect(response.body).toEqual({
      acao: "Verifique os dados enviados e tente novamente.",
      mensagem:
        "Não conseguimos validar os dados enviados, verifique os campos.",
      nome: "Erro na Requisição",
      statusCode: 400,
    });
  });
  test("Com cpf ao enviar tipo pessoa juridica", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const registro = {
      nome: "NOVA EMPRESA",
      cpf: "43589568000",
      ie: "213123",
      tipo: "juridica",
    };
    const response = await request(app)
      .post("/v1/registros")
      .send(registro)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(400);
    console.log(response.body);

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
      .post("/v1/registros")
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
      .post("/v1/registros")
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
      .post("/v1/registros")

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
