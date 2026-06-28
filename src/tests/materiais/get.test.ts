import request from "supertest";
import { app } from "../../app";
import { test, beforeEach, expect, describe } from "vitest";
import orchestrator from "../orchestrator";
import { gerarToken } from "../../services/jwt";

beforeEach(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.createDefaultTable();
});

describe("GET to /v1/materiais", async () => {
  test("Deve retornar todos os materiais", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const cat1 = await orchestrator.createCatMaterial({ nome: "CAT1" });
    const cat2 = await orchestrator.createCatMaterial({ nome: "CAT2" });
    await orchestrator.createMaterial({ nome: "MATERIAL 1", catID: cat1.id });
    await orchestrator.createMaterial({ nome: "MATERIAL 2", catID: cat2.id });
    await orchestrator.createMaterial({ nome: "MATERIAL 3", catID: cat1.id });
    await orchestrator.createMaterial({ nome: "MATERIAL 4", catID: cat2.id });

    const response = await request(app)
      .get("/v1/materiais")
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(4);
  });
  test("Deve retornar materias somente de uma categoria", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const cat1 = await orchestrator.createCatMaterial({ nome: "CAT1" });
    const cat2 = await orchestrator.createCatMaterial({ nome: "CAT2" });
    await orchestrator.createMaterial({ nome: "MATERIAL 1", catID: cat1.id });
    await orchestrator.createMaterial({ nome: "MATERIAL 2", catID: cat2.id });
    await orchestrator.createMaterial({ nome: "MATERIAL 3", catID: cat1.id });
    await orchestrator.createMaterial({ nome: "MATERIAL 4", catID: cat2.id });
    await orchestrator.createMaterial({ nome: "MATERIAL 5", catID: cat1.id });
    await orchestrator.createMaterial({ nome: "MATERIAL 6", catID: cat2.id });

    const response = await request(app)
      .get(`/v1/materiais?catID=${cat2.id}`)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(200);
    console.log(response.body);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(3);
    expect(response.body[0].catID).toEqual(cat2.id);
  });
  test("Deve retornar materias somente de uma categoria com filtro de pesquisa", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const cat1 = await orchestrator.createCatMaterial({ nome: "CAT1" });
    const cat2 = await orchestrator.createCatMaterial({ nome: "CAT2" });
    await orchestrator.createMaterial({
      nome: "AB MATERIAL 1",
      catID: cat1.id,
    });
    await orchestrator.createMaterial({
      nome: " AB MATERIAL 2",
      catID: cat2.id,
    });
    await orchestrator.createMaterial({
      nome: " CB MATERIAL 3",
      catID: cat1.id,
    });
    await orchestrator.createMaterial({
      nome: " CL MATERIAL 4",
      catID: cat2.id,
    });
    await orchestrator.createMaterial({
      nome: "CB MATERIAL 5",
      catID: cat1.id,
    });
    await orchestrator.createMaterial({
      nome: "AL MATERIAL 6",
      catID: cat2.id,
    });

    const response = await request(app)
      .get(`/v1/materiais?catID=${cat2.id}&&search=AB`)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(200);
    console.log(response.body);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0].catID).toEqual(cat2.id);
  });
  test("Deve retornar materias somente de uma categoria com filtro de ordenação", async () => {
    const user = await orchestrator.userAuthenticated({
      nome: "ADMINISTRADOR",
    });
    const cat1 = await orchestrator.createCatMaterial({ nome: "CAT1" });
    const cat2 = await orchestrator.createCatMaterial({ nome: "CAT2" });
    await orchestrator.createMaterial({
      nome: "K MATERIAL 1",
      catID: cat1.id,
    });
    await orchestrator.createMaterial({
      nome: "A MATERIAL 2",
      catID: cat2.id,
    });
    await orchestrator.createMaterial({
      nome: "AA MATERIAL 3",
      catID: cat1.id,
    });
    await orchestrator.createMaterial({
      nome: " C MATERIAL 4",
      catID: cat2.id,
    });
    await orchestrator.createMaterial({
      nome: "D MATERIAL 5",
      catID: cat1.id,
    });
    await orchestrator.createMaterial({
      nome: "E MATERIAL 6",
      catID: cat2.id,
    });

    const response = await request(app)
      .get(`/v1/materiais?catID=${cat1.id}&&order=nome`)
      .auth(user.jwt, { type: "bearer" })
      .expect("Content-Type", /json/)
      .expect(200);
    console.log(response.body);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(3);
    expect(response.body[0].catID).toEqual(cat1.id);
    expect(response.body[0].nome).toEqual("AA MATERIAL 3");
  });
  test("Com token JWT invalido", async () => {
    const response = await request(app)
      .get("/v1/materiais")
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
      .get("/v1/materiais")
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
      .get("/v1/materiais")

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
