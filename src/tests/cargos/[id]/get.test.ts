import request from "supertest";
import { app } from "../../../app";
import { test, beforeEach, expect, describe } from "vitest";
import orchestrator from "../../orchestrator";
import { gerarToken } from "../../../services/jwt";

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

describe("GET /v1/cargos/[id]/", () => {
  test("Com id válido, sem permissões", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const cargo = await orchestrator.createCargo({
      nome: "CARGO NOVO",
      permissoes: [],
    });

    const response = await request(app)
      .get(`/v1/cargos/${cargo.id}`)
      .expect(200)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      id: response.body.id,
      nome: "CARGO NOVO",
      permissoes: cargo.permissoes,
    });
    expect(response.body.permissoes.length).toBe(0);
  });
  test("Com id válido, com permissões", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const permissoes = await orchestrator.findPermissions();
    const cargo = await orchestrator.createCargo({
      nome: "CARGO NOVO",
      permissoes: [permissoes[0].id, permissoes[1].id],
    });

    const response = await request(app)
      .get(`/v1/cargos/${cargo.id}`)
      .expect(200)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      id: response.body.id,
      nome: "CARGO NOVO",
      permissoes: [
        {
          id: permissoes[0].id,
          descricao: permissoes[0].descricao,
          nome: permissoes[0].nome,
        },
        {
          id: permissoes[1].id,
          descricao: permissoes[1].descricao,
          nome: permissoes[1].nome,
        },
      ],
    });
    expect(response.body.permissoes.length).toBe(2);
  });
  test("Com id inválido", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });

    const response = await request(app)
      .get("/v1/cargos/9999123")
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
      .get("/v1/cargos/2")
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
      .get("/v1/cargos/1")
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
      .get("/v1/cargos/2")
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
      .get("/v1/cargos/1")

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
