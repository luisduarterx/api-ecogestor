import { Response } from "express";
import { ExtendedRequest } from "../types/extended-request";
import { z } from "zod";
import { BadRequest, NotFound } from "../error";
import {
  createCategory,
  deleteCategory,
  findAllCategories,
  findUniqueCategory,
} from "../model/categorias";

export const POST = async (req: ExtendedRequest, res: Response) => {
  try {
    const data = req.body;
    const dataSchema = z.object({
      id: z.number().int().optional(),
      nome: z.string().min(3).toUpperCase(),
    });
    const dataParsed = dataSchema.safeParse(data);

    if (!dataParsed.success) {
      throw new BadRequest();
    }

    const categoria = await createCategory(dataParsed.data);

    res.status(201).json(categoria);
  } catch (error: any) {
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
  }
};
export const DELETE = async (req: ExtendedRequest, res: Response) => {
  try {
    const catID = parseInt(req.params.catID as string);
    const catSchema = z.number().int().max(2147483646);
    const id = catSchema.safeParse(catID);

    if (!id.success) {
      throw new BadRequest();
    }

    const categoria = await deleteCategory(id.data);

    res.status(200).json(categoria);
  } catch (error: any) {
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
  }
};
export const GETS = async (req: ExtendedRequest, res: Response) => {
  try {
    const categorias = await findAllCategories();

    res.status(200).json(categorias);
  } catch (error: any) {
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
  }
};

export const GET_UNIQUE = async (req: ExtendedRequest, res: Response) => {
  try {
    const catID = parseInt(req.params.catID);

    const idSchema = z.number().int().max(2147483646).positive();
    const id = idSchema.safeParse(catID);

    if (!id.success) {
      throw new BadRequest();
    }

    const categoria = await findUniqueCategory(id.data);

    if (!categoria) {
      throw new NotFound();
    }

    res.status(200).json(categoria);
  } catch (error: any) {
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
  }
};
