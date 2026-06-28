import { Response } from "express";
import { ExtendedRequest } from "../types/extended-request";
import { z } from "zod";
import { BadRequest, NotFound } from "../error";
import categoria from "../model/categorias";

export const POST = async (req: ExtendedRequest, res: Response) => {
  try {
    const DataInput = z
      .object({
        nome: z
          .string()
          .min(3)
          .max(200)
          .regex(/^[a-zA-Z0-9 ]+$/)
          .toUpperCase(),
      })
      .safeParse(req.body);

    if (!DataInput.success) {
      throw new BadRequest();
    }

    const newCat = await categoria.create(DataInput.data);

    res.status(201).json(newCat);
  } catch (error: any) {
    throw error;
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

    const categoriaDeletada = await categoria.deleteUnique(id.data);

    res.status(200).json(categoriaDeletada);
  } catch (error: any) {
    throw error;
  }
};
export const GETS = async (req: ExtendedRequest, res: Response) => {
  try {
    const filter = z.string().max(50).safeParse(req.query.search);
    const categorias = await categoria.findAll({ filter: filter.data });

    res.status(200).json(categorias);
  } catch (error: any) {
    throw error;
  }
};

export const GET_UNIQUE = async (req: ExtendedRequest, res: Response) => {
  try {
    const catID = parseInt(req.params.catID);

    const idSchema = z.number().int().max(2147483646).positive();
    const id = idSchema.safeParse(catID);
    console.log(catID);
    if (!id.success) {
      throw new BadRequest();
    }

    const categoriaEncontrada = await categoria.getByID(id.data);

    res.status(200).json(categoriaEncontrada);
  } catch (error: any) {
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
  }
};
export const PATCH = async (req: ExtendedRequest, res: Response) => {
  try {
    const catID = parseInt(req.params.catID);
    const idSchema = z.number().int().max(2147483646).positive();
    const id = idSchema.safeParse(catID);

    const dataInput = z
      .object({ nome: z.string().min(3).max(90) })
      .safeParse(req.body);

    if (!id.success || !dataInput.success) {
      throw new BadRequest();
    }

    const categoriaAtualizada = await categoria.update({
      id: id.data,
      nome: dataInput.data.nome,
    });

    res.status(200).json(categoriaAtualizada);
  } catch (error: any) {
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
  }
};
