import { expect, test } from "vitest";

interface User {
  name: string;
  age: number;
}

test("POST /api/v1/status", async () => {
  const response = await fetch("http://localhost:4000/v1/status", {
    method: "POST",
  });
  const responseBody = await response.json();
  expect(response.status).toBe(405);
  expect(responseBody).toEqual({
    nome: "MethodNotAllowed",
    menssagem: "Esse método não é permitido para esse endpoint.",
    acao: "Verifique se o método HTTP enviado é válido para esse endpoint.",
    statusCode: 405,
  });
});
