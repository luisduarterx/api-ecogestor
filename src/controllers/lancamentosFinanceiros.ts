import { Response } from "express";
import { z } from "zod";
import { BadRequest, UnAuthorized } from "../error";
import lancamentoFinanceiro from "../model/lancamentoFinanceiro";
import { ExtendedRequest } from "../types/extended-request";

const idSchema = z.coerce.number().int().positive();
const dinheiroSchema = z
  .union([
    z.number().positive().finite(),
    z.string().regex(/^\d+(?:\.\d{1,2})?$/),
  ])
  .transform(String);
const dinheiroNaoNegativoSchema = z
  .union([
    z.number().nonnegative().finite(),
    z.string().regex(/^\d+(?:\.\d{1,2})?$/),
  ])
  .transform(String);

const exigirUsuario = (req: ExtendedRequest) => {
  if (!req.user?.id) {
    throw new UnAuthorized();
  }
  return req.user.id;
};

const lancamentoBaseSchema = z.object({
  valor: dinheiroSchema,
  descricao: z.string().trim().min(3).max(250),
  tipo: z.enum(["PAGAR", "RECEBER"]),
  titulo: z.string().trim().min(3).max(100),
  parcela: z.coerce.number().int().positive().optional(),
  categoria_id: idSchema,
  vencimento: z.coerce.date(),
  desconto: dinheiroNaoNegativoSchema.optional(),
  acrescimo: dinheiroNaoNegativoSchema.optional(),
  registro_id: idSchema.optional(),
});

export const lancamentos = {
  POST: async (req: ExtendedRequest, res: Response) => {
    const user_id = exigirUsuario(req);
    const body = lancamentoBaseSchema.strict().safeParse(req.body);
    if (!body.success) throw new BadRequest();
    const lancamento = await lancamentoFinanceiro.criar({
      ...body.data,
      user_id,
    });
    res.status(201).json(lancamento);
  },
  GET: async (req: ExtendedRequest, res: Response) => {
    const query = z
      .object({
        status: z.enum(["ABERTO", "PAGO", "CANCELADO"]).optional(),
        tipo: z.enum(["PAGAR", "RECEBER"]).optional(),
        categoria_id: idSchema.optional(),
        registro_id: idSchema.optional(),
        pedido_id: idSchema.optional(),
        vencimento_inicial: z.coerce.date().optional(),
        vencimento_final: z.coerce.date().optional(),
      })
      .strict()
      .refine(
        ({ vencimento_inicial, vencimento_final }) =>
          !vencimento_inicial ||
          !vencimento_final ||
          vencimento_inicial <= vencimento_final,
      )
      .safeParse(req.query);
    if (!query.success) throw new BadRequest();
    const resultado = await lancamentoFinanceiro.listar(query.data);
    res.status(200).json(resultado);
  },
  GET_UNIQUE: async (req: ExtendedRequest, res: Response) => {
    const id = idSchema.safeParse(req.params.id);
    if (!id.success) throw new BadRequest();
    const resultado = await lancamentoFinanceiro.buscarPorId(id.data);
    res.status(200).json(resultado);
  },
  PATCH: async (req: ExtendedRequest, res: Response) => {
    const id = idSchema.safeParse(req.params.id);
    const body = lancamentoBaseSchema
      .omit({ tipo: true })
      .partial()
      .strict()
      .safeParse(req.body);
    if (!id.success || !body.success || Object.keys(body.data).length === 0) {
      throw new BadRequest();
    }
    const resultado = await lancamentoFinanceiro.atualizar({
      id: id.data,
      ...body.data,
    });
    res.status(200).json(resultado);
  },
  BAIXAR: async (req: ExtendedRequest, res: Response) => {
    const user_id = exigirUsuario(req);
    const id = idSchema.safeParse(req.params.id);
    const body = z
      .object({ conta_id: idSchema })
      .strict()
      .safeParse(req.body);
    if (!id.success || !body.success) throw new BadRequest();
    const resultado = await lancamentoFinanceiro.baixar(
      id.data,
      body.data.conta_id,
      user_id,
    );
    res.status(200).json(resultado);
  },
  CANCELAR: async (req: ExtendedRequest, res: Response) => {
    const id = idSchema.safeParse(req.params.id);
    if (!id.success) throw new BadRequest();
    const resultado = await lancamentoFinanceiro.cancelar(id.data);
    res.status(200).json(resultado);
  },
  ESTORNAR: async (req: ExtendedRequest, res: Response) => {
    const user_id = exigirUsuario(req);
    const id = idSchema.safeParse(req.params.id);
    const body = z
      .object({ motivo: z.string().trim().min(3).max(250) })
      .strict()
      .safeParse(req.body);
    if (!id.success || !body.success) throw new BadRequest();
    const resultado = await lancamentoFinanceiro.estornar(
      id.data,
      body.data.motivo,
      user_id,
    );
    res.status(200).json(resultado);
  },
};
