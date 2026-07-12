import { Response } from "express";
import { ExtendedRequest } from "../types/extended-request";
import { z } from "zod";
import { BadRequest, NotFound } from "../error";
import categoria from "../model/categoria";
import banco from "../model/bancos";

export const POST = async (req: ExtendedRequest, res: Response) => {
  try {
    const body = z
      .object({
        nome: z.string().max(200).toUpperCase(),
        descricao: z.string().max(200).toUpperCase(),
        saldo_inicial: z.coerce.number().positive(),
        status: z.boolean().optional(),
      })
      .safeParse(req.body);

    if (!body.success) {
      throw new BadRequest();
    }

    const novoBanco = await banco.create(body.data);

    res.status(201).json(novoBanco);
  } catch (error) {
    throw error;
  }
};
export const DELETE = async (req: ExtendedRequest, res: Response) => {
  try {
    const id = z.coerce.number().int().positive().safeParse(req.params.bancoID);

    if (!id.success) {
      throw new BadRequest();
    }

    const bancoDeletado = await banco.deleteUnique(id.data);

    res.status(200).json(bancoDeletado);
  } catch (error) {
    throw error;
  }
};
export const GET = async (req: ExtendedRequest, res: Response) => {
  try {
    const search = z.string().max(50).safeParse(req.query.search);

    const bancosEncontrados = await banco.findAll({ filters: search.data });
    res.status(200).json(bancosEncontrados);
  } catch (error) {
    throw error;
  }
};
export const GET_UNIQUE = async (req: ExtendedRequest, res: Response) => {
  try {
    const id = z.coerce.number().int().positive().safeParse(req.params.bancoID);

    if (!id.success) {
      throw new BadRequest();
    }

    const bancoEncontrado = await banco.getByID(id.data);

    res.status(200).json(bancoEncontrado);
  } catch (error) {
    throw error;
  }
};
export const PATCH = async (req: ExtendedRequest, res: Response) => {
  try {
    const id = z.coerce.number().int().positive().safeParse(req.params.bancoID);
    const body = z
      .object({
        nome: z.string().max(200).toUpperCase().optional(),
        descricao: z.string().max(200).toUpperCase().optional(),
        saldo_inicial: z.coerce.number().positive().optional(),
        status: z.boolean().optional().optional(),
      })
      .safeParse(req.body);

    if (!body.success || !id.success) {
      console.log(body.error);
      throw new BadRequest();
    }

    const bancoAtualizado = await banco.update({
      id: id.data,
      data: body.data,
    });

    res.status(200).json(bancoAtualizado);
  } catch (error) {
    throw error;
  }
};
