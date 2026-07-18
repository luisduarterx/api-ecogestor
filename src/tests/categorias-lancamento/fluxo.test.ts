import request from "supertest";
import { beforeEach, describe, expect, test } from "vitest";
import { app } from "../../app";
import { prisma } from "../../libs/prisma";
import orchestrator from "../orchestrator";

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

describe("Categorias de lançamento", () => {
  test("cria uma categoria normalizando o nome", async () => {
    const user = await orchestrator.userAuthenticated({});
    const response = await request(app)
      .post("/v1/financeiro/categorias-lancamento")
      .auth(user.jwt, { type: "bearer" })
      .send({ nome: "Venda de materiais", tipo: "RECEITA" })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        nome: "VENDA DE MATERIAIS",
        TipoCategoria: "RECEITA",
      }),
    );
  });

  test("impede nomes duplicados sem diferenciar maiúsculas", async () => {
    const user = await orchestrator.userAuthenticated({});
    await request(app)
      .post("/v1/financeiro/categorias-lancamento")
      .auth(user.jwt, { type: "bearer" })
      .send({ nome: "Energia elétrica", tipo: "DESPESA" })
      .expect(201);

    const response = await request(app)
      .post("/v1/financeiro/categorias-lancamento")
      .auth(user.jwt, { type: "bearer" })
      .send({ nome: "energia elétrica", tipo: "DESPESA" })
      .expect(409);

    expect(response.body.mensagem).toBe(
      "Já existe uma categoria com este nome.",
    );
  });

  test("lista por tipo e consulta uma categoria", async () => {
    const user = await orchestrator.userAuthenticated({});
    const receita = await prisma.categoriaLancamento.create({
      data: { nome: "VENDAS", TipoCategoria: "RECEITA" },
    });
    await prisma.categoriaLancamento.create({
      data: { nome: "ALUGUEL", TipoCategoria: "DESPESA" },
    });

    const lista = await request(app)
      .get("/v1/financeiro/categorias-lancamento?tipo=RECEITA")
      .auth(user.jwt, { type: "bearer" })
      .expect(200);
    expect(lista.body).toHaveLength(1);
    expect(lista.body[0].id).toBe(receita.id);

    const detalhe = await request(app)
      .get(`/v1/financeiro/categorias-lancamento/${receita.id}`)
      .auth(user.jwt, { type: "bearer" })
      .expect(200);
    expect(detalhe.body.nome).toBe("VENDAS");
  });

  test("edita nome e tipo de categoria ainda não utilizada", async () => {
    const user = await orchestrator.userAuthenticated({});
    const categoria = await prisma.categoriaLancamento.create({
      data: { nome: "OUTROS", TipoCategoria: "RECEITA" },
    });

    const response = await request(app)
      .patch(`/v1/financeiro/categorias-lancamento/${categoria.id}`)
      .auth(user.jwt, { type: "bearer" })
      .send({ nome: "Despesas diversas", tipo: "DESPESA" })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        nome: "DESPESAS DIVERSAS",
        TipoCategoria: "DESPESA",
      }),
    );
  });

  test("exclui categoria sem lançamentos", async () => {
    const user = await orchestrator.userAuthenticated({});
    const categoria = await prisma.categoriaLancamento.create({
      data: { nome: "TEMPORARIA", TipoCategoria: "DESPESA" },
    });

    await request(app)
      .delete(`/v1/financeiro/categorias-lancamento/${categoria.id}`)
      .auth(user.jwt, { type: "bearer" })
      .expect(200);

    expect(
      await prisma.categoriaLancamento.findUnique({
        where: { id: categoria.id },
      }),
    ).toBeNull();
  });

  test("preserva categoria utilizada por lançamento", async () => {
    const user = await orchestrator.userAuthenticated({});
    const categoria = await prisma.categoriaLancamento.create({
      data: { nome: "FORNECEDORES", TipoCategoria: "DESPESA" },
    });
    await prisma.lancamentoFinanceiro.create({
      data: {
        valor: 50,
        descricao: "Pagamento de fornecedor",
        tipo: "PAGAR",
        titulo: "Fornecedor",
        status: "ABERTO",
        categoria_id: categoria.id,
        vencimento: new Date("2026-08-10"),
        user_id: user.id,
      },
    });

    const response = await request(app)
      .delete(`/v1/financeiro/categorias-lancamento/${categoria.id}`)
      .auth(user.jwt, { type: "bearer" })
      .expect(409);

    expect(response.body.mensagem).toBe(
      "Não é possível excluir uma categoria que possui lançamentos.",
    );
  });

  test("exige autenticação", async () => {
    await request(app)
      .get("/v1/financeiro/categorias-lancamento")
      .expect(401);
  });
});
