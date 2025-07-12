import { Response } from "express";
import { ExtendedRequest } from "../types/extended-request";
import * as dbCargo from "../model/cargos";
import { z } from "zod";
import { BadRequest, InternalError, NotFound } from "../error";

export const GET = async (req: ExtendedRequest, res: Response) => {
  try {
    const cargos = await dbCargo.getAllRoles();

    res.status(200).json(cargos);
  } catch (error: any) {
    console.log(error);
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
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

    const cargo = await dbCargo.getRoleByID(id.data);
    if (!cargo) {
      throw new NotFound();
    }

    res.status(200).json(cargo);
  } catch (error: any) {
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
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

    const cargo = await dbCargo.addNewRole(data.data);

    if (!cargo) {
      throw new InternalError();
    }

    res.status(201).json(cargo);
  } catch (error: any) {
    console.log(error);
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
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

    const cargo = await dbCargo.deleteRoleByID(id.data);

    if (!cargo) {
      throw new InternalError();
    }

    res.status(200).json(cargo);
  } catch (error: any) {
    console.log(error);
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
  }
};
