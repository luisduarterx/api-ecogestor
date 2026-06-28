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
export const PUT = async (req: ExtendedRequest, res: Response) => {
  try {
    const matID = parseInt(req.params.matID as string);
    const matSchema = z.number().int().max(2147483646);
    const id = matSchema.safeParse(matID);

    const dataSchema = z.object({
      catID: z.number().max(2147483646).optional(),
      nome: z.string().toUpperCase().min(3).optional(),
      v_compra: z.number().positive().min(0).optional(),
      v_venda: z.number().positive().min(0).optional(),
      status: z.boolean().optional(),
    });
    const data = dataSchema.safeParse(req.body);

    if (!data.success) {
      throw new BadRequest();
    }

    const materialAtualizado = await material.update(
      id.data as number,
      data.data,
    );
    res.status(200).json(material);
  } catch (error: any) {
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
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

export type ParamsFindMaterial = {
  catID?: number;
  order?: "id" | "nome";
  search?: string;
};
