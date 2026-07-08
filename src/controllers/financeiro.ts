import { Response } from "express";
import { ExtendedRequest } from "../types/extended-request";
import { z } from "zod";
import { BadRequest } from "../error";
import material from "../model/materiais";
import contaFinanceira from "../model/contaFinanceira";

export const conta = {
  POST: async (req: ExtendedRequest, res: Response) => {
    try {
      const data = z
        .object({
          nome: z.string().toUpperCase().min(3),
          saldo_inicial: z.coerce.number().positive(),
          conta_padrao: z.boolean().optional(),
        })
        .strict()
        .safeParse(req.body);

      if (!data.success) {
        throw new BadRequest();
      }

      const novaConta = await contaFinanceira.create(data.data);

      res.status(201).json(novaConta);
    } catch (error: any) {
      throw error;
    }
  },
  PATCH: async (req: ExtendedRequest, res: Response) => {
    try {
      const contaID = z.coerce
        .number()
        .positive()
        .int()
        .safeParse(req.params.id);

      const body = z
        .object({
          nome: z.string().toUpperCase().min(3).optional(),
          conta_padrao: z.boolean().optional(),
          status: z.boolean().optional(),
        })
        .strict()
        .safeParse(req.body);
      console.log(req.body);
      if (!body.success || !contaID.success) {
        throw new BadRequest();
      }

      const contaAtualizada = await contaFinanceira.update({
        id: contaID.data,
        data: body.data,
      });
      res.status(200).json(contaAtualizada);
    } catch (error: any) {
      throw error;
    }
  },
  GET: async (req: ExtendedRequest, res: Response) => {
    try {
      const contasEncontradas = await contaFinanceira.findAll();

      res.json(contasEncontradas);
    } catch (error: any) {
      throw error;
    }
  },
  GET_UNIQUE: async (req: ExtendedRequest, res: Response) => {
    try {
      const id = z.coerce.number().positive().safeParse(req.params.id);

      if (!id.success) {
        throw new BadRequest();
      }

      const contaEncontrada = await contaFinanceira.getByID(id.data);

      res.status(200).json(contaEncontrada);
    } catch (error) {
      throw error;
    }
  },
  DELETE: async (req: ExtendedRequest, res: Response) => {
    try {
      const id = z.coerce.number().positive().safeParse(req.params.id);
      console.log(id);
      if (!id.success) {
        throw new BadRequest();
      }

      const contaDeletada = await contaFinanceira.deleteUnique(id.data);

      res.status(200).json(contaDeletada);
    } catch (error) {
      throw error;
    }
  },
};
