import { expect, test } from "vitest";

interface User {
  name: string;
  age: number;
}

test("GET api/v1/status", async () => {
  const response = await fetch("http://localhost:4000/v1/status");
  const responseBody = await response.json();
  expect(responseBody.database.versao).toBeDefined();
  expect(response.status).toBe(200);
});
