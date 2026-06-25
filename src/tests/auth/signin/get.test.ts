import request from "supertest";
import { app } from "../../../app";
import { test, beforeEach, expect, describe } from "vitest";
import orchestrator from "../../orchestrator";

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

describe("GET /v1/auth/sigin", () => {
  test("Requisição com método nao permitido.", async () => {
    const response = await request(app).get("/v1/auth/signin");
    console.log(response.body);
    expect(response.body).toEqual({
      nome: "MethodNotAllowed",
      mensagem: "Esse método não é permitido para esse endpoint.",
      acao: "Verifique se o método HTTP enviado é válido para esse endpoint.",
      statusCode: 405,
    });
  });
});
