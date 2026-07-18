import { Response } from "express";
import { z } from "zod";
import { BadRequest, UnAuthorized } from "../error";
import pedido from "../model/pedido";
import { ExtendedRequest } from "../types/extended-request";

const idSchema = z.coerce.number().int().positive();
const decimalPositivo = z
  .union([
    z.number().positive().finite(),
    z.string().regex(/^\d+(?:\.\d{1,2})?$/),
  ])
  .transform(String);
const decimalNaoNegativo = z
  .union([
    z.number().nonnegative().finite(),
    z.string().regex(/^\d+(?:\.\d{1,2})?$/),
  ])
  .transform(String);

const exigirUsuario = (req: ExtendedRequest) => {
  if (!req.user?.id) throw new UnAuthorized();
  return req.user.id;
};

const itemSchema = z
  .object({
    materialID: idSchema,
    pesoBruto: decimalPositivo,
    tara: decimalNaoNegativo,
    impureza: decimalNaoNegativo,
    preco: decimalPositivo,
  })
  .strict();

export const pedidos = {
  POST: async (req: ExtendedRequest, res: Response) => {
    const userID = exigirUsuario(req);
    const body = z
      .object({ tipo: z.enum(["COMPRA", "VENDA"]) })
      .strict()
      .safeParse(req.body);
    if (!body.success) throw new BadRequest();
    const resultado = await pedido.criar(body.data.tipo, userID);
    res.status(201).json(resultado);
  },
  GET: async (req: ExtendedRequest, res: Response) => {
    const query = z
      .object({
        status: z.enum(["ABERTO", "FECHADO", "CANCELADO"]).optional(),
        tipo: z.enum(["COMPRA", "VENDA"]).optional(),
        regID: idSchema.optional(),
        caixaID: idSchema.optional(),
      })
      .strict()
      .safeParse(req.query);
    if (!query.success) throw new BadRequest();
    const resultado = await pedido.listar(query.data);
    res.status(200).json(resultado);
  },
  GET_UNIQUE: async (req: ExtendedRequest, res: Response) => {
    const id = idSchema.safeParse(req.params.id);
    if (!id.success) throw new BadRequest();
    const resultado = await pedido.buscarPorId(id.data);
    res.status(200).json(resultado);
  },
  PATCH_REGISTRO: async (req: ExtendedRequest, res: Response) => {
    const id = idSchema.safeParse(req.params.id);
    const body = z
      .object({ regID: idSchema.nullable() })
      .strict()
      .safeParse(req.body);
    if (!id.success || !body.success) throw new BadRequest();
    const resultado = await pedido.definirRegistro(id.data, body.data.regID);
    res.status(200).json(resultado);
  },
  POST_ITEM: async (req: ExtendedRequest, res: Response) => {
    const id = idSchema.safeParse(req.params.id);
    const body = itemSchema.safeParse(req.body);
    if (!id.success || !body.success) throw new BadRequest();
    const resultado = await pedido.adicionarItem(id.data, body.data);
    res.status(201).json(resultado);
  },
  PATCH_ITEM: async (req: ExtendedRequest, res: Response) => {
    const pedidoID = idSchema.safeParse(req.params.id);
    const itemID = idSchema.safeParse(req.params.itemId);
    const body = itemSchema.safeParse(req.body);
    if (!pedidoID.success || !itemID.success || !body.success) {
      throw new BadRequest();
    }
    const resultado = await pedido.atualizarItem(
      pedidoID.data,
      itemID.data,
      body.data,
    );
    res.status(200).json(resultado);
  },
  DELETE_ITEM: async (req: ExtendedRequest, res: Response) => {
    const pedidoID = idSchema.safeParse(req.params.id);
    const itemID = idSchema.safeParse(req.params.itemId);
    if (!pedidoID.success || !itemID.success) throw new BadRequest();
    const resultado = await pedido.removerItem(pedidoID.data, itemID.data);
    res.status(200).json(resultado);
  },
  FINALIZAR: async (req: ExtendedRequest, res: Response) => {
    const user_id = exigirUsuario(req);
    const id = idSchema.safeParse(req.params.id);
    const body = z
      .object({
        regID: idSchema,
        titulos: z
          .array(
            z
              .object({
                valor: decimalPositivo,
                vencimento: z.coerce.date(),
                categoria_id: idSchema,
                titulo: z.string().trim().min(3).max(100),
                descricao: z.string().trim().min(3).max(250),
                baixar_agora: z.boolean().default(false),
                conta_id: idSchema.optional(),
              })
              .strict(),
          )
          .min(1),
      })
      .strict()
      .safeParse(req.body);
    if (!id.success || !body.success) throw new BadRequest();
    const resultado = await pedido.finalizar(
      id.data,
      body.data.regID,
      body.data.titulos,
      user_id,
    );
    res.status(200).json(resultado);
  },
  CANCELAR: async (req: ExtendedRequest, res: Response) => {
    const id = idSchema.safeParse(req.params.id);
    if (!id.success) throw new BadRequest();
    const resultado = await pedido.cancelar(id.data);
    res.status(200).json(resultado);
  },
  REABRIR: async (req: ExtendedRequest, res: Response) => {
    const user_id = exigirUsuario(req);
    const id = idSchema.safeParse(req.params.id);
    if (!id.success) throw new BadRequest();
    const resultado = await pedido.reabrir(id.data, user_id);
    res.status(200).json(resultado);
  },
};
