import { Response } from "express";
import { ExtendedRequest } from "../types/extended-request";
import { z } from "zod";
import { BadRequest } from "../error";
import material from "../model/materiais";

export const POST = async (req: ExtendedRequest, res: Response) => {
  try {
    const dataSchema = z.object({
      catID: z.number(),
      nome: z.string().toUpperCase().min(3),
      preco_compra: z.number().nonnegative().min(0),
      preco_venda: z.number().nonnegative().min(0),
    });
    const data = dataSchema.safeParse(req.body);

    if (!data.success) {
      throw new BadRequest();
    }

    const novoMaterial = await material.create(data.data);

    res.status(201).json(novoMaterial);
  } catch (error: any) {
    throw error;
  }
};
export const PATCH = async (req: ExtendedRequest, res: Response) => {
  try {
    const matID = z.coerce
      .number()
      .positive()
      .int()
      .safeParse(req.params.matID);

    const dataSchema = z.object({
      catID: z.number().max(2147483646).optional(),
      nome: z.string().toUpperCase().min(3).optional(),
      preco_compra: z.number().positive().min(0).optional(),
      preco_venda: z.number().positive().min(0).optional(),
    });
    const body = dataSchema.safeParse(req.body);

    if (!body.success || !matID.success) {
      throw new BadRequest();
    }

    const materialAtualizado = await material.update(matID.data, body.data);
    res.status(200).json(materialAtualizado);
  } catch (error: any) {
    throw error;
  }
};
export const GETS = async (req: ExtendedRequest, res: Response) => {
  try {
    const filters = z
      .object({
        catID: z.coerce.number().positive().int().optional(),
        order: z.enum(["nome", "id"]).optional(),
        search: z.string().optional(),
      })
      .safeParse(req.query);

    if (!filters.success) {
      console.log("ERRO ZOD:", filters.error);
      throw new BadRequest();
    }

    const materiais = await material.findAll({
      catID: filters.data.catID,
      order: filters.data.order,
      search: filters.data.search,
    });

    res.json(materiais);
  } catch (error: any) {
    throw error;
  }
};
export const GET_UNIQUE = async (req: ExtendedRequest, res: Response) => {
  try {
    const id = z.coerce.number().positive().safeParse(req.params.matID);

    if (!id.success) {
      throw new BadRequest();
    }

    const materialEncontrado = await material.getByID(id.data);

    res.status(200).json(materialEncontrado);
  } catch (error) {
    throw error;
  }
};
export const DELETE = async (req: ExtendedRequest, res: Response) => {
  try {
    const id = z.coerce.number().positive().safeParse(req.params.matID);

    if (!id.success) {
      throw new BadRequest();
    }

    const materialDeletado = await material.deleteUnique(id.data);

    res.status(200).json(materialDeletado);
  } catch (error) {
    throw error;
  }
};

export type ParamsFindMaterial = {
  catID?: number;
  order?: "id" | "nome";
  search?: string;
};
