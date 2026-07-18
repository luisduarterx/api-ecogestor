import request from "supertest";
import { beforeEach, describe, expect, test } from "vitest";
import { app } from "../../app";
import { prisma } from "../../libs/prisma";
import orchestrator from "../orchestrator";

beforeEach(async () => {
  await orchestrator.clearDatabase();
});

type UsuarioTeste = Awaited<ReturnType<typeof orchestrator.userAuthenticated>>;

const criarCategoria = async (
  usuario: UsuarioTeste,
  tipo: "RECEITA" | "DESPESA",
) => {
  const response = await request(app)
    .post("/v1/financeiro/categorias-lancamento")
    .auth(usuario.jwt, { type: "bearer" })
    .send({
      nome: tipo === "RECEITA" ? "RECEITAS DO CAIXA" : "DESPESAS DO CAIXA",
      tipo,
    })
    .expect(201);

  return response.body as { id: number };
};

const criarLancamento = async (
  usuario: UsuarioTeste,
  props: {
    categoria_id: number;
    tipo: "PAGAR" | "RECEBER";
    valor: string;
    desconto?: string;
    acrescimo?: string;
  },
) => {
  const response = await request(app)
    .post("/v1/financeiro/lancamentos")
    .auth(usuario.jwt, { type: "bearer" })
    .send({
      titulo: `LANÇAMENTO ${props.tipo}`,
      descricao: `INTEGRAÇÃO DO CAIXA COM ${props.tipo}`,
      vencimento: "2026-12-10",
      ...props,
    })
    .expect(201);

  return response.body as { id: number };
};

const prepararCaixa = async (saldo_inicial = 1000) => {
  const usuario = await orchestrator.userAuthenticated({ nome: "ADMIN" });
  const conta = await orchestrator.createConta({
    nome: "CONTA PADRÃO",
    conta_padrao: true,
    saldo_inicial,
  });
  const caixa = await orchestrator.abrirCaixa({
    user_id: usuario.id,
    conta_id: conta.id,
  });

  return { usuario, conta, caixa };
};

describe("Integração entre caixa e lançamentos financeiros", () => {
  test("inclui a baixa de lançamento a pagar nos débitos e despesas do caixa", async () => {
    const { usuario, conta, caixa } = await prepararCaixa();
    const categoria = await criarCategoria(usuario, "DESPESA");
    const lancamento = await criarLancamento(usuario, {
      categoria_id: categoria.id,
      tipo: "PAGAR",
      valor: "120.50",
      desconto: "20.50",
    });

    const baixa = await request(app)
      .post(`/v1/financeiro/lancamentos/${lancamento.id}/baixar`)
      .auth(usuario.jwt, { type: "bearer" })
      .send({ conta_id: conta.id })
      .expect(200);

    expect(baixa.body).toMatchObject({
      status: "PAGO",
      valor: 120.5,
      desconto: 20.5,
    });
    expect(baixa.body.movimentacoes).toEqual([
      expect.objectContaining({
        caixa_id: caixa.id,
        conta_id: conta.id,
        origem: "LANCAMENTO_PAGAR",
        direcao: "SAIDA",
        saldo_inicial: 1000,
        valor: 100,
        saldo_final: 900,
      }),
    ]);

    const consulta = await request(app)
      .get("/v1/financeiro/caixa/consulta")
      .auth(usuario.jwt, { type: "bearer" })
      .expect(200);

    expect(consulta.body).toMatchObject({
      caixa_id: caixa.id,
      valor_abertura: 1000,
      despesa_total: 100,
      total_creditos: 0,
      total_debitos: 100,
      valor_esperado: 900,
    });
  });

  test("inclui a baixa de lançamento a receber nos créditos do caixa", async () => {
    const { usuario, conta, caixa } = await prepararCaixa();
    const categoria = await criarCategoria(usuario, "RECEITA");
    const lancamento = await criarLancamento(usuario, {
      categoria_id: categoria.id,
      tipo: "RECEBER",
      valor: "75.25",
      acrescimo: "4.75",
    });

    await request(app)
      .post(`/v1/financeiro/lancamentos/${lancamento.id}/baixar`)
      .auth(usuario.jwt, { type: "bearer" })
      .send({ conta_id: conta.id })
      .expect(200);

    const consulta = await request(app)
      .get("/v1/financeiro/caixa/consulta")
      .auth(usuario.jwt, { type: "bearer" })
      .expect(200);

    expect(consulta.body).toMatchObject({
      caixa_id: caixa.id,
      despesa_total: 0,
      total_creditos: 80,
      total_debitos: 0,
      valor_esperado: 1080,
    });
    expect(consulta.body.movimentacoes).toEqual([
      expect.objectContaining({
        caixa_id: caixa.id,
        origem: "LANCAMENTO_RECEBER",
        direcao: "ENTRADA",
        valor: 80,
      }),
    ]);
  });

  test("não altera o caixa enquanto o lançamento permanece aberto", async () => {
    const { usuario, caixa } = await prepararCaixa();
    const categoria = await criarCategoria(usuario, "DESPESA");
    await criarLancamento(usuario, {
      categoria_id: categoria.id,
      tipo: "PAGAR",
      valor: "350.00",
    });

    const consulta = await request(app)
      .get("/v1/financeiro/caixa/consulta")
      .auth(usuario.jwt, { type: "bearer" })
      .expect(200);

    expect(consulta.body).toMatchObject({
      caixa_id: caixa.id,
      despesa_total: 0,
      total_creditos: 0,
      total_debitos: 0,
      valor_esperado: 1000,
    });
    expect(consulta.body.movimentacoes).toEqual([]);
  });

  test("estorna a baixa no mesmo caixa por movimento inverso", async () => {
    const { usuario, conta, caixa } = await prepararCaixa();
    const categoria = await criarCategoria(usuario, "DESPESA");
    const lancamento = await criarLancamento(usuario, {
      categoria_id: categoria.id,
      tipo: "PAGAR",
      valor: "125.00",
    });

    await request(app)
      .post(`/v1/financeiro/lancamentos/${lancamento.id}/baixar`)
      .auth(usuario.jwt, { type: "bearer" })
      .send({ conta_id: conta.id })
      .expect(200);

    const estorno = await request(app)
      .post(`/v1/financeiro/lancamentos/${lancamento.id}/estornar`)
      .auth(usuario.jwt, { type: "bearer" })
      .send({ motivo: "BAIXA REALIZADA POR ENGANO" })
      .expect(200);

    expect(estorno.body.status).toBe("ABERTO");
    expect(estorno.body.movimentacoes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          caixa_id: caixa.id,
          origem: "LANCAMENTO_PAGAR",
          direcao: "SAIDA",
          valor: 125,
          estornada: true,
        }),
        expect.objectContaining({
          caixa_id: caixa.id,
          origem: "ESTORNO",
          direcao: "ENTRADA",
          valor: 125,
        }),
      ]),
    );

    const consulta = await request(app)
      .get("/v1/financeiro/caixa/consulta")
      .auth(usuario.jwt, { type: "bearer" })
      .expect(200);
    expect(consulta.body).toMatchObject({
      total_creditos: 125,
      total_debitos: 125,
      valor_esperado: 1000,
    });

    const contaAtual = await prisma.contaFinanceira.findUniqueOrThrow({
      where: { id: conta.id },
    });
    expect(contaAtual.saldo_atual.toNumber()).toBe(1000);
  });

  test("fecha o caixa reconciliando baixas a pagar e a receber", async () => {
    const { usuario, conta, caixa } = await prepararCaixa();
    const categoriaDespesa = await criarCategoria(usuario, "DESPESA");
    const categoriaReceita = await criarCategoria(usuario, "RECEITA");
    const pagar = await criarLancamento(usuario, {
      categoria_id: categoriaDespesa.id,
      tipo: "PAGAR",
      valor: "125.50",
    });
    const receber = await criarLancamento(usuario, {
      categoria_id: categoriaReceita.id,
      tipo: "RECEBER",
      valor: "80.25",
    });

    for (const lancamento of [pagar, receber]) {
      await request(app)
        .post(`/v1/financeiro/lancamentos/${lancamento.id}/baixar`)
        .auth(usuario.jwt, { type: "bearer" })
        .send({ conta_id: conta.id })
        .expect(200);
    }

    const fechamento = await request(app)
      .post("/v1/financeiro/caixa/fechar")
      .auth(usuario.jwt, { type: "bearer" })
      .send({ saldo_informado: "954.75" })
      .expect(200);

    expect(fechamento.body).toMatchObject({
      id: caixa.id,
      status: "FECHADO",
      saldo_inicial: 1000,
      saldo_final_sistema: 954.75,
      saldo_final_informado: 954.75,
      diferenca: 0,
      movimentacao_correcao: null,
    });
  });

  test("impede nova baixa na conta padrão depois do fechamento do caixa", async () => {
    const { usuario, conta } = await prepararCaixa();
    const categoria = await criarCategoria(usuario, "DESPESA");
    const lancamento = await criarLancamento(usuario, {
      categoria_id: categoria.id,
      tipo: "PAGAR",
      valor: "50.00",
    });

    await request(app)
      .post("/v1/financeiro/caixa/fechar")
      .auth(usuario.jwt, { type: "bearer" })
      .send({ saldo_informado: 1000 })
      .expect(200);

    const response = await request(app)
      .post(`/v1/financeiro/lancamentos/${lancamento.id}/baixar`)
      .auth(usuario.jwt, { type: "bearer" })
      .send({ conta_id: conta.id })
      .expect(409);

    expect(response.body.mensagem).toBe(
      "A conta padrão não pode ser movimentada sem um caixa aberto.",
    );

    const lancamentoPersistido =
      await prisma.lancamentoFinanceiro.findUniqueOrThrow({
        where: { id: lancamento.id },
      });
    expect(lancamentoPersistido.status).toBe("ABERTO");
  });
});
