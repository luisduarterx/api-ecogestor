import request from "supertest";
import { beforeEach, describe, expect, test } from "vitest";
import { app } from "../../app";
import { prisma } from "../../libs/prisma";
import orchestrator from "../orchestrator";

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

const criarCategoria = async (jwt: string, tipo: "RECEITA" | "DESPESA") => {
  const response = await request(app)
    .post("/v1/financeiro/categorias-lancamento")
    .auth(jwt, { type: "bearer" })
    .send({ nome: tipo === "RECEITA" ? "Vendas" : "Fornecedores", tipo })
    .expect(201);
  return response.body as { id: number };
};

describe("Módulo de lançamentos financeiros", () => {
  test("cria, lista e consulta categorias", async () => {
    const user = await orchestrator.userAuthenticated({});
    const categoria = await criarCategoria(user.jwt, "RECEITA");

    const response = await request(app)
      .get("/v1/financeiro/categorias-lancamento")
      .auth(user.jwt, { type: "bearer" })
      .expect(200);

    expect(response.body).toEqual([
      expect.objectContaining({
        id: categoria.id,
        nome: "VENDAS",
        TipoCategoria: "RECEITA",
      }),
    ]);
  });

  test("cria lançamento aberto e retorna valores monetários numéricos", async () => {
    const user = await orchestrator.userAuthenticated({});
    const categoria = await criarCategoria(user.jwt, "DESPESA");

    const response = await request(app)
      .post("/v1/financeiro/lancamentos")
      .auth(user.jwt, { type: "bearer" })
      .send({
        titulo: "Compra de insumos",
        descricao: "Compra mensal de insumos",
        tipo: "PAGAR",
        valor: "100.25",
        desconto: "0.25",
        categoria_id: categoria.id,
        vencimento: "2026-08-10",
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        titulo: "Compra de insumos",
        tipo: "PAGAR",
        status: "ABERTO",
        valor: 100.25,
        desconto: 0.25,
        acrescimo: 0,
      }),
    );
  });

  test("baixa lançamento integralmente e estorna por movimento inverso", async () => {
    const user = await orchestrator.userAuthenticated({});
    const categoria = await criarCategoria(user.jwt, "RECEITA");
    const conta = await orchestrator.createConta({
      nome: "BANCO SECUNDARIO",
      saldo_inicial: 50,
      conta_padrao: false,
    });
    const criado = await request(app)
      .post("/v1/financeiro/lancamentos")
      .auth(user.jwt, { type: "bearer" })
      .send({
        titulo: "Venda avulsa",
        descricao: "Recebimento de venda avulsa",
        tipo: "RECEBER",
        valor: "125.40",
        categoria_id: categoria.id,
        vencimento: "2026-08-10",
      })
      .expect(201);

    const baixado = await request(app)
      .post(`/v1/financeiro/lancamentos/${criado.body.id}/baixar`)
      .auth(user.jwt, { type: "bearer" })
      .send({ conta_id: conta.id })
      .expect(200);

    expect(baixado.body.status).toBe("PAGO");
    expect(baixado.body.movimentacoes[0]).toEqual(
      expect.objectContaining({
        direcao: "ENTRADA",
        saldo_inicial: 50,
        valor: 125.4,
        saldo_final: 175.4,
      }),
    );

    const estornado = await request(app)
      .post(`/v1/financeiro/lancamentos/${criado.body.id}/estornar`)
      .auth(user.jwt, { type: "bearer" })
      .send({ motivo: "Pagamento informado incorretamente" })
      .expect(200);

    expect(estornado.body.status).toBe("ABERTO");
    expect(estornado.body.movimentacoes).toHaveLength(2);
    const contaAtual = await prisma.contaFinanceira.findUniqueOrThrow({
      where: { id: conta.id },
    });
    expect(contaAtual.saldo_atual.toNumber()).toBe(50);
    expect(estornado.body.movimentacoes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ estornada: true, direcao: "ENTRADA" }),
        expect.objectContaining({
          origem: "ESTORNO",
          direcao: "SAIDA",
          valor: 125.4,
        }),
      ]),
    );
  });

  test("impede baixa na conta padrão sem caixa aberto", async () => {
    const user = await orchestrator.userAuthenticated({});
    const categoria = await criarCategoria(user.jwt, "DESPESA");
    const conta = await orchestrator.createConta({
      nome: "CAIXA PADRAO",
      saldo_inicial: 100,
      conta_padrao: true,
    });
    const criado = await request(app)
      .post("/v1/financeiro/lancamentos")
      .auth(user.jwt, { type: "bearer" })
      .send({
        titulo: "Despesa operacional",
        descricao: "Pagamento de despesa operacional",
        tipo: "PAGAR",
        valor: "20.00",
        categoria_id: categoria.id,
        vencimento: "2026-08-10",
      })
      .expect(201);

    const response = await request(app)
      .post(`/v1/financeiro/lancamentos/${criado.body.id}/baixar`)
      .auth(user.jwt, { type: "bearer" })
      .send({ conta_id: conta.id })
      .expect(409);

    expect(response.body.mensagem).toBe(
      "A conta padrão não pode ser movimentada sem um caixa aberto.",
    );
  });

  test("cancela lançamento aberto sem apagar o histórico", async () => {
    const user = await orchestrator.userAuthenticated({});
    const categoria = await criarCategoria(user.jwt, "DESPESA");
    const criado = await request(app)
      .post("/v1/financeiro/lancamentos")
      .auth(user.jwt, { type: "bearer" })
      .send({
        titulo: "Conta cancelada",
        descricao: "Conta cadastrada por engano",
        tipo: "PAGAR",
        valor: "10.00",
        categoria_id: categoria.id,
        vencimento: "2026-08-10",
      })
      .expect(201);

    const response = await request(app)
      .post(`/v1/financeiro/lancamentos/${criado.body.id}/cancelar`)
      .auth(user.jwt, { type: "bearer" })
      .expect(200);

    expect(response.body.status).toBe("CANCELADO");
    expect(
      await prisma.lancamentoFinanceiro.findUnique({
        where: { id: criado.body.id },
      }),
    ).not.toBeNull();
  });
});
