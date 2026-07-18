import request from "supertest";
import { app } from "../../app";
import { test, beforeEach, expect, describe } from "vitest";
import orchestrator from "../orchestrator";
import { gerarToken } from "../../services/jwt";

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

describe("POST /v1/financeiro/transferencia", () => {
  test("Deve criar uma transferencia entre duas contas normais.", async () => {
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

    const transferencia = {
      valor: 50.0,
      conta_origem_id: c1.id,
      conta_destino_id: c2.id,
    };

    const response = await request(app)
      .post("/v1/financeiro/transferencia")
      .send(transferencia)
      .expect(201)
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
    expect(response.body.movimentacoes[0].saldo_final).toBe(50);
    expect(response.body.movimentacoes[1].saldo_final).toBe(150);
  });
  test("Bloqueia transferência da conta padrão sem caixa aberto", async () => {
    const user = await orchestrator.userAuthenticated({});
    const contaPadrao = await orchestrator.createConta({
      nome: "CONTA PADRAO",
      conta_padrao: true,
      saldo_inicial: 100,
    });
    const destino = await orchestrator.createConta({
      nome: "CONTA DESTINO",
      conta_padrao: false,
      saldo_inicial: 100,
    });

    const response = await request(app)
      .post("/v1/financeiro/transferencia")
      .send({
        valor: 50,
        conta_origem_id: contaPadrao.id,
        conta_destino_id: destino.id,
      })
      .auth(user.jwt, { type: "bearer" })
      .expect(409);

    expect(response.body.mensagem).toBe(
      "A conta padrão não pode ser movimentada sem um caixa aberto.",
    );
  });

  test("Vincula ao caixa somente o movimento da conta padrão", async () => {
    const user = await orchestrator.userAuthenticated({});
    const contaPadrao = await orchestrator.createConta({
      nome: "CONTA PADRAO",
      conta_padrao: true,
      saldo_inicial: 100,
    });
    const destino = await orchestrator.createConta({
      nome: "CONTA DESTINO",
      conta_padrao: false,
      saldo_inicial: 100,
    });
    const caixa = await orchestrator.abrirCaixa({
      user_id: user.id,
      conta_id: contaPadrao.id,
    });

    const response = await request(app)
      .post("/v1/financeiro/transferencia")
      .send({
        valor: 50,
        conta_origem_id: contaPadrao.id,
        conta_destino_id: destino.id,
      })
      .auth(user.jwt, { type: "bearer" })
      .expect(201);

    expect(response.body.caixa_id).toBe(caixa.id);
    expect(response.body.movimentacoes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          conta_id: contaPadrao.id,
          caixa_id: caixa.id,
        }),
        expect.objectContaining({ conta_id: destino.id, caixa_id: null }),
      ]),
    );
  });

  test("Bloqueia transferência com conta inativa", async () => {
    const user = await orchestrator.userAuthenticated({});
    const origem = await orchestrator.createConta({
      nome: "CONTA INATIVA",
      conta_padrao: false,
      saldo_inicial: 100,
      status: false,
    });
    const destino = await orchestrator.createConta({
      nome: "CONTA ATIVA",
      conta_padrao: false,
      saldo_inicial: 100,
    });

    const response = await request(app)
      .post("/v1/financeiro/transferencia")
      .send({
        valor: 50,
        conta_origem_id: origem.id,
        conta_destino_id: destino.id,
      })
      .auth(user.jwt, { type: "bearer" })
      .expect(409);

    expect(response.body.mensagem).toBe(
      "Não é possível transferir valores utilizando uma conta inativa.",
    );
  });
  // test("Deve criar uma transferencia entre uma conta padrao e uma normal", async () => {
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
  //     .post("/v1/financeiro/transferencia")
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
  test("Tenta criar uma transferencia com valor 0", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const transferencia = {
      valor: 0,
      conta_origem_id: 2,
      conta_destino_id: 1,
    };

    const response = await request(app)
      .post("/v1/financeiro/transferencia")
      .send(transferencia)
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
  test("Tenta criar uma transferencia com contas iguais", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const c1 = await orchestrator.createConta({
      nome: "CONTA 1",
      conta_padrao: false,
      saldo_inicial: 100,
    });

    const transferencia = {
      valor: 50.0,
      conta_origem_id: c1.id,
      conta_destino_id: c1.id,
    };

    const response = await request(app)
      .post("/v1/financeiro/transferencia")
      .send(transferencia)
      .expect(409)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      acao: "Refaça a operação, caso persista contate um administrador.",
      mensagem: "A conta de origem e a conta de destino devem ser diferentes.",
      nome: "ConflictError",
      statusCode: 409,
    });
  });

  test("Com token JWT valido e usuario inexistente", async () => {
    const token = gerarToken({ nome: "luis" });

    const response = await request(app)
      .post("/v1/financeiro/transferencia")
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
      .post("/v1/financeiro/transferencia")
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
      .post("/v1/financeiro/transferencia")
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
      .post("/v1/financeiro/transferencia")

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
