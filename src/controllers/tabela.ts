import { Response } from "express";
import { ExtendedRequest } from "../types/extended-request";
import tabela from "../model/tabela";
import { z } from "zod";
import { BadRequest, InternalError, NotFound } from "../error";

export const GET = async (req: ExtendedRequest, res: Response) => {
  try {
    const tabelasEncontradas = await tabela.findAll();

    res.status(200).json(tabelasEncontradas);
  } catch (error) {
    throw error;
  }
};
export const GET_UNIQUE = async (req: ExtendedRequest, res: Response) => {
  try {
    const id = z.coerce
      .number()
      .int()
      .positive()

      .safeParse(req.params.tabID);

    if (!id.success) {
      console.log(id.error);
      throw new BadRequest();
    }

    const tabelaEncontrada = await tabela.getByID(id.data);

    res.status(200).json(tabelaEncontrada);
  } catch (error) {
    throw error;
  }
};
export const PATCH = async (req: ExtendedRequest, res: Response) => {
  try {
    const id = z.coerce.number().int().positive().safeParse(req.params.tabID);
    const body = z
      .object({
        nome: z.string().toUpperCase().max(100).optional(),
        padrao: z.boolean().optional(),
        materiais: z
          .array(
            z.object({
              id: z.coerce.number().int().positive(),
              preco_compra: z.coerce.number().positive(),
            }),
          )
          .optional(),
      })
      .strict()
      .safeParse(req.body);

    if (!id.success || !body.success) {
      console.log("erro", id.error, body.error);
      throw new BadRequest();
    }

    const tabelaEditada = await tabela.update({ id: id.data, data: body.data });

    res.status(200).json(tabelaEditada);
  } catch (error) {
    throw error;
  }
};
export const POST = async (req: ExtendedRequest, res: Response) => {
  try {
    const body = z
      .object({
        nome: z.string().toUpperCase().max(100),
        padrao: z.boolean().optional(),
        materiais: z
          .array(
            z.object({
              id: z.coerce.number().int().positive(),
              preco_compra: z.coerce.number().positive(),
            }),
          )
          .optional(),
      })

      .strict()
      .safeParse(req.body);
    console.log(req.body);
    if (!body.success) {
      console.log(body.error);
      throw new BadRequest();
    }

    const novaTabela = await tabela.create(body.data);

    res.status(201).json(novaTabela);
  } catch (error) {
    throw error;
  }
};
export const DELETE = async (req: ExtendedRequest, res: Response) => {
  try {
    const id = z.coerce
      .number()
      .int()
      .positive()

      .safeParse(req.params.tabID);

    if (!id.success) {
      throw new BadRequest();
    }

    const tabelaDeletada = await tabela.deleteUnique(id.data);

    res.status(200).json(tabelaDeletada);
  } catch (error) {
    throw error;
  }
};
