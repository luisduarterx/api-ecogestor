import request from "supertest";
import { app } from "../../app";
import { test, beforeEach, expect } from "vitest";
import orchestrator from "../orchestrator";

beforeEach(() => {
  orchestrator.clearDatabase();
});
test("GET api/v1/status", async () => {
  const response = await request(app).get("/v1/status").expect(200);
  console.log(response.body);

  expect(response.body.database.versao).toBeDefined();
});
