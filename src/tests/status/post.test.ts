import request from "supertest";
import { app } from "../../app";
import { test, beforeEach, expect } from "vitest";
import orchestrator from "../orchestrator";

beforeEach(() => {
  orchestrator.clearDatabase();
});
test("POST /api/v1/status", async () => {
  const response = await request(app)
    .post("/v1/status")
    .expect(405)
    .expect("Content-Type", /json/);

  expect(response.body).toEqual({
    nome: "MethodNotAllowed",
    mensagem: "Esse método não é permitido para esse endpoint.",
    acao: "Verifique se o método HTTP enviado é válido para esse endpoint.",
    statusCode: 405,
  });
});
