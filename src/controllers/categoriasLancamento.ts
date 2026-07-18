import { Response } from "express";
import { z } from "zod";
import { BadRequest } from "../error";
import categoriaLancamento from "../model/categoriaLancamento";
import { ExtendedRequest } from "../types/extended-request";

const idSchema = z.coerce.number().int().positive();
const categoriaSchema = z
  .object({
    nome: z
      .string()
      .trim()
      .min(3)
      .max(60)
      .transform((nome) => nome.toUpperCase()),
    tipo: z.enum(["RECEITA", "DESPESA"]),
  })
  .strict();

export const categoriasLancamento = {
  POST: async (req: ExtendedRequest, res: Response) => {
    const body = categoriaSchema.safeParse(req.body);
    if (!body.success) throw new BadRequest();
    const categoria = await categoriaLancamento.criar(body.data);
    res.status(201).json(categoria);
  },
  GET: async (req: ExtendedRequest, res: Response) => {
    const query = z
      .object({ tipo: z.enum(["RECEITA", "DESPESA"]).optional() })
      .strict()
      .safeParse(req.query);
    if (!query.success) throw new BadRequest();
    const categorias = await categoriaLancamento.listar(query.data.tipo);
    res.status(200).json(categorias);
  },
  GET_UNIQUE: async (req: ExtendedRequest, res: Response) => {
    const id = idSchema.safeParse(req.params.id);
    if (!id.success) throw new BadRequest();
    const categoria = await categoriaLancamento.buscarPorId(id.data);
    res.status(200).json(categoria);
  },
  PATCH: async (req: ExtendedRequest, res: Response) => {
    const id = idSchema.safeParse(req.params.id);
    const body = categoriaSchema.partial().strict().safeParse(req.body);
    if (!id.success || !body.success || Object.keys(body.data).length === 0) {
      throw new BadRequest();
    }
    const categoria = await categoriaLancamento.atualizar(id.data, body.data);
    res.status(200).json(categoria);
  },
  DELETE: async (req: ExtendedRequest, res: Response) => {
    const id = idSchema.safeParse(req.params.id);
    if (!id.success) throw new BadRequest();
    const categoria = await categoriaLancamento.remover(id.data);
    res.status(200).json(categoria);
  },
};
