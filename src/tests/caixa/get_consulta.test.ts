import request from "supertest";
import { app } from "../../app";
import { test, beforeEach, expect, describe } from "vitest";
import orchestrator from "../orchestrator";
import { gerarToken } from "../../services/jwt";
import { StatusCaixa } from "../../../generated/prisma/enums";

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

describe("GET /v1/financeiro/caixa/consulta", () => {
  test("Consulta um caixa", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const conta = await orchestrator.createConta({
      nome: "PADRAO",
      conta_padrao: true,
      saldo_inicial: 1000,
    });
    const c2 = await orchestrator.createConta({
      nome: "DUA",
      conta_padrao: false,
      saldo_inicial: 1000,
    });
    const caixa = await orchestrator.abrirCaixa({
      user_id: user.id,
      conta_id: conta.id,
    });

    const t1 = await orchestrator.createTransferencia({
      conta_destino_id: c2.id,
      conta_origem_id: conta.id,
      valor: 250,
      user_id: user.id,
    });
    const t2 = await orchestrator.createTransferencia({
      conta_destino_id: conta.id,
      conta_origem_id: c2.id,
      valor: 120,
      user_id: user.id,
    });

    const response = await request(app)
      .get("/v1/financeiro/caixa/consulta")
      .expect(200)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    console.log("BODY", response.body);

    expect(response.body).toMatchObject({
      valor_abertura: 1000,

      abastecimento_total: 120,

      retiradas_total: 250,

      total_creditos: 120,

      total_debitos: 250,

      valor_esperado: 870,
    });

    expect(response.body.movimentacoes).toHaveLength(2);

    expect(
      response.body.movimentacoes.every(
        (movimentacao: { conta_id: number }) =>
          movimentacao.conta_id === conta.id,
      ),
    ).toBe(true);
  });

  test("Retorna 404 quando não existe caixa aberto", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const response = await request(app)
      .get("/v1/financeiro/caixa/consulta")
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(404);

    expect(response.body).toMatchObject({
      mensagem: "Não foi encontrado nenhum caixa aberto!",
      statusCode: 404,
    });
  });

  // test("Tenta criar um caixa, com um caixa já aberto", async () => {
  //   const user = await orchestrator.userAuthenticated({
  //     nome: "ADMINISTRADOR",
  //   });
  //   const conta = await orchestrator.createConta({
  //     conta_padrao: true,
  //     saldo_inicial: 1000,
  //     nome: "DINHEIRO",
  //   });

  //   await orchestrator.abrirCaixa({
  //     user_id: user.id,
  //     conta_id: conta.id,
  //     observacao: "",
  //   });
  //   const response = await request(app)
  //     .get("/v1/financeiro/caixa/consulta")
  //     .expect(409)
  //     .auth(user.jwt, { type: "bearer" })
  //     .expect("Content-Type", /json/);

  //   console.log(response.body);

  //   expect(response.body).toEqual({
  //     acao: "Refaça a operação, caso persista contate um administrador.",
  //     mensagem: "Feche o caixa aberto para abrir outro novamente.",
  //     nome: "ConflictError",
  //     statusCode: 409,
  //   });
  // });
  test("Com token JWT valido e usuario inexistente", async () => {
    const token = gerarToken({ nome: "luis" });

    const response = await request(app)
      .get("/v1/financeiro/caixa/consulta")
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
      .get("/v1/financeiro/caixa/consulta")
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
      .get("/v1/financeiro/caixa/consulta")
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
      .get("/v1/financeiro/caixa/consulta")

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
