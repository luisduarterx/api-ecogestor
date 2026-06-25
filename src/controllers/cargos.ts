import { Response } from "express";
import { ExtendedRequest } from "../types/extended-request";
import cargo from "../model/cargos";
import { z } from "zod";
import { BadRequest, InternalError, NotFound } from "../error";

export const GET = async (req: ExtendedRequest, res: Response) => {
  try {
    const cargos = await cargo.findAll();

    res.status(200).json(cargos);
  } catch (error: any) {
    throw error;
  }
};
export const GETUNIQUE = async (req: ExtendedRequest, res: Response) => {
  try {
    const roleID = parseInt(req.params.roleID);

    const idSchema = z.number().int().max(2147483646).positive();
    const id = idSchema.safeParse(roleID);

    if (!id.success) {
      throw new BadRequest();
    }

    const found = await cargo.getByID({ id: id.data });
    if (!found) {
      throw new NotFound();
    }

    res.status(200).json(found);
  } catch (error: any) {
    throw error;
  }
};
export const POST = async (req: ExtendedRequest, res: Response) => {
  try {
    const dataSchema = z.object({
      nome: z.string().min(3).toUpperCase(),
      permissoes: z.number().array(),
    });

    const data = dataSchema.safeParse(req.body);

    if (!data.success) {
      throw new BadRequest();
    }

    const novoCargo = await cargo.create(data.data);

    res.status(201).json(novoCargo);
  } catch (error: unknown) {
    throw error;
  }
};
export const DELETE = async (req: ExtendedRequest, res: Response) => {
  try {
    const data = parseInt(req.params.roleID);
    const schemaID = z.number().int().max(2147483646);
    const id = schemaID.safeParse(data);

    if (!id.success) {
      throw new BadRequest("O id informado não é válido!");
    }

    const deleted = await cargo.deleteUnique({ id: id.data });

    res.status(200).json(deleted);
  } catch (error: any) {
    throw error;
  }
};
