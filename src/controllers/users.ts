import { RequestHandler } from "express";
import { z } from "zod";
import {
  BadRequest,
  BaseError,
  InternalError,
  NotFound,
  UserNotFound,
  ValidationError,
} from "../error";
import user from "../model/user";
import { ExtendedRequest } from "../types/extended-request";

export const POST: RequestHandler = async (req, res) => {
  try {
    const body = req.body;

    const userSchema = z.object({
      nome: z.string(),
      email: z.string().email(),
      senha: z.string(),
      cargoID: z.number(),
      telefone: z.string().optional(),
    });

    const userData = userSchema.safeParse(req.body);

    if (!userData.success) {
      throw new BadRequest();
    }

    const usuario = await user.create(userData.data);

    res.status(201).json(usuario);
  } catch (error: any) {
    throw error;
  }
};
export const GET: RequestHandler = async (req, res) => {
  try {
    const search = z.string().max(50).safeParse(req.query.search);

    const users = await user.findAll({ filter: search.data });
    if (!users) {
      throw new Error("Não foi possivel buscar por usuarios");
    }
    res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};
export const DELETE: RequestHandler = async (req: ExtendedRequest, res) => {
  try {
    const userID = z
      .number()
      .int()
      .positive()
      .safeParse(Number(req.params.userID));

    if (userID.data === req.user?.id) {
      throw new ValidationError("Não é possivel deletar o próprio usuário.");
    }
    if (!userID.success) {
      throw new BadRequest();
    }

    const deletedUser = await user.deleteUnique(userID.data);
    res.status(200).json(deletedUser);
  } catch (error: any) {
    throw error;
  }
};
export const PATCH: RequestHandler = async (req, res) => {
  try {
    const userID = z
      .number()
      .int()
      .positive()
      .safeParse(parseInt(req.params.userID));

    if (!userID.success) {
      throw new BadRequest();
    }

    const userData = z
      .object({
        nome: z.string().max(205).optional(),
        email: z.string().email().optional(),
        telefone: z.string().optional(),
        cargoID: z.number().optional(),
      })
      .safeParse(req.body);

    if (!userData.success) {
      throw new BadRequest();
    }

    const updatedUser = await user.update({
      id: userID.data,
      data: userData.data,
    });

    if (!updatedUser) {
      throw new InternalError();
    }

    res.json(updatedUser);
  } catch (error: any) {
    console.log(error);
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
  }

  //parei aqui
};

export const GET_UNIQUE: RequestHandler = async (req, res) => {
  try {
    const id = z
      .number()
      .positive()
      .int()
      .safeParse(parseInt(req.params.userID));

    if (!id.success) {
      throw new BadRequest();
    }

    const usuario = await user.getUserByID(id.data);

    if (!usuario) {
      throw new NotFound();
    }

    res.json(usuario);
  } catch (error) {
    throw error;
  }
};
