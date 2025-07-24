import { Response } from "express";
import { ExtendedRequest } from "../types/extended-request";
import { z } from "zod";
import { BadRequest } from "../error";
import {
  createMaterial,
  findAllMateriais,
  updateMaterial,
} from "../model/materiais";

export const POST = async (req: ExtendedRequest, res: Response) => {
  try {
    const dataSchema = z.object({
      catID: z.number(),
      nome: z.string().toUpperCase().min(3),
      v_compra: z.number().positive().min(0),
      v_venda: z.number().positive().min(0),
    });
    const data = dataSchema.safeParse(req.body);

    if (!data.success) {
      throw new BadRequest();
    }

    const material = await createMaterial(data.data);

    res.status(201).json(material);
  } catch (error: any) {
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
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

    const material = await updateMaterial(id.data as number, data.data);
    res.status(200).json(material);
  } catch (error: any) {
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
  }
};
export const GETS = async (req: ExtendedRequest, res: Response) => {
  try {
    const { catID, order, search }: ParamsFindMaterial = req.query;

    const orderSchema = z.enum(["nome", "id"]).optional();
    const orderBy = orderSchema.safeParse(order);

    if (!orderBy.success) {
      throw new BadRequest();
    }

    const materiais = await findAllMateriais({ catID, order, search });
    res.json(materiais);
  } catch (error: any) {
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
  }
};
export const GET_UNIQUE = (req: ExtendedRequest, res: Response) => {};

export type ParamsFindMaterial = {
  catID?: number;
  order?: "id" | "nome";
  search?: string;
};
