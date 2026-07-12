import request from "supertest";
import { app } from "../../app";
import { test, beforeEach, expect, describe } from "vitest";
import orchestrator from "../orchestrator";
import { gerarToken } from "../../services/jwt";

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

describe("POST /v1/financeiro/transferencia/estorno/${transferencia.id}", () => {
  test("Deve estornar uma transferencia com sucesso", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const c1 = await orchestrator.createConta({
      nome: "CONTA 1",
      conta_padrao: false,
      saldo_inicial: 100,
    });
    const c2 = await orchestrator.createConta({
      nome: "CONTA 2",
      conta_padrao: false,
      saldo_inicial: 100,
    });

    const transferencia = await orchestrator.createTransferencia({
      valor: 50.0,
      conta_origem_id: c1.id,
      conta_destino_id: c2.id,
      user_id: user.id,
    });

    const response = await request(app)
      .post(`/v1/financeiro/transferencia/estorno/${transferencia.id}`)
      .expect(201)
      .send({
        motivo: "ESTORNO DE TESTE",
      })
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    expect(response.body).toMatchObject({
      id: expect.any(Number),
      conta_origem_id: expect.any(Number),
      conta_destino_id: expect.any(Number),
      valor: expect.any(Number),
      descricao: expect.any(String),
      criado_em: expect.any(String),
      user_id: expect.any(Number),
      caixa_id: null,
      movimentacoes: expect.any(Object),
    });
    expect(response.body.movimentacoes.length).toBe(2);
    expect(Date.parse(response.body.criado_em)).not.toBeNaN();
    expect(response.body.movimentacoes[0].saldo_final).toBe(100);
    expect(response.body.movimentacoes[1].saldo_final).toBe(100);
  });
  // test("Deve criar um estorno de uma conta com caixa aberto", async () => {
  //   const user = await orchestrator.userAuthenticated({
  //     nome: "ADMINISTRADOR",
  //   });
  //   const c1 = await orchestrator.createConta({
  //     nome: "CONTA 1",
  //     conta_padrao: true,
  //     saldo_inicial: 100,
  //   });
  //   const c2 = await orchestrator.createConta({
  //     nome: "CONTA 2",
  //     conta_padrao: false,
  //     saldo_inicial: 100,
  //   });

  //   const transferencia = {
  //     valor: 50.0,
  //     conta_origem_id: c1.id,
  //     conta_destino_id: c2.id,
  //   };

  //   const response = await request(app)
  //     .post(`/v1/financeiro/transferencia/estorno/${transferencia.id}`)
  //     .send(transferencia)
  //     .expect(201)
  //     .auth(user.jwt, { type: "bearer" })
  //     .expect("Content-Type", /json/);

  //   expect(response.body).toMatchObject({
  //     id: expect.any(Number),
  //     conta_origem_id: expect.any(Number),
  //     conta_destino_id: expect.any(Number),
  //     valor: expect.any(Number),
  //     descricao: expect.any(String),
  //     criado_em: expect.any(String),
  //     user_id: expect.any(Number),
  //     caixa_id: null,
  //     movimentacoes: expect.any(Object),
  //   });
  // });
  test("Tenta estornar uma transferencia já estornada", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const c1 = await orchestrator.createConta({
      nome: "CONTA 1",
      conta_padrao: false,
      saldo_inicial: 100,
    });
    const c2 = await orchestrator.createConta({
      nome: "CONTA 2",
      conta_padrao: false,
      saldo_inicial: 100,
    });

    const transferencia = await orchestrator.createTransferencia({
      valor: 50.0,
      conta_origem_id: c1.id,
      conta_destino_id: c2.id,
      user_id: user.id,
    });
    const estorno = await orchestrator.createEstorno({
      id: transferencia.id,
      user_id: user.id,
      motivo: "TESTE DE ESTORNO",
    });

    const response = await request(app)
      .post(`/v1/financeiro/transferencia/estorno/${transferencia.id}`)
      .send({ motivo: "QUERO TENTAR" })
      .expect(409)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      acao: "Refaça a operação, caso persista contate um administrador.",
      mensagem: "Esta transferência já foi estornada.",
      nome: "ConflictError",
      statusCode: 409,
    });
  });
  test("Tenta estornar um estorno de outra transferencia", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const c1 = await orchestrator.createConta({
      nome: "CONTA 1",
      conta_padrao: false,
      saldo_inicial: 100,
    });
    const c2 = await orchestrator.createConta({
      nome: "CONTA 2",
      conta_padrao: false,
      saldo_inicial: 100,
    });

    const transferencia = await orchestrator.createTransferencia({
      valor: 50.0,
      conta_origem_id: c1.id,
      conta_destino_id: c2.id,
      user_id: user.id,
    });
    const estorno = await orchestrator.createEstorno({
      id: transferencia.id,
      user_id: user.id,
      motivo: "TESTE DE ESTORNO",
    });

    const response = await request(app)
      .post(`/v1/financeiro/transferencia/estorno/${estorno.id}`)
      .send({ motivo: "QUERO TENTAR" })
      .expect(409)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      acao: "Refaça a operação, caso persista contate um administrador.",
      mensagem:
        "Uma transferência de estorno não pode ser estornada diretamente.",
      nome: "ConflictError",
      statusCode: 409,
    });
  });
  test("Tenta estornar sem um motivo declarado", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const response = await request(app)
      .post(`/v1/financeiro/transferencia/estorno/12`)
      .send({ motivo: "" })
      .expect(400)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      acao: "Verifique os dados enviados e tente novamente.",
      mensagem:
        "Não conseguimos validar os dados enviados, verifique os campos.",
      nome: "Erro na Requisição",
      statusCode: 400,
    });
  });

  test("Com token JWT valido e usuario inexistente", async () => {
    const token = gerarToken({ nome: "luis" });

    const response = await request(app)
      .post(`/v1/financeiro/transferencia/estorno/9`)
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
      .post(`/v1/financeiro/transferencia/estorno/1`)
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
      .post(`/v1/financeiro/transferencia/estorno/1`)
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
      .post("/v1/financeiro/transferencia/estorno/1")

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
