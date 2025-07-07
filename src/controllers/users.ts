import { RequestHandler } from "express";
import { z } from "zod";
import { BadRequest, BaseError } from "../error";
import * as DBUser from "../model/users";

export const POST: RequestHandler = async (req, res) => {
  const body = req.body;

  const userSchema = z.object({
    nome: z.string(),
    email: z.string().email(),
    senha: z.string(),
    cargo: z.number(),
    telefone: z.string().optional(),
  });

  try {
    const userData = userSchema.safeParse(req.body);

    if (!userData.success) {
      throw new BadRequest();
    }

    const user = await DBUser.createUser(userData.data);

    res.status(201).json(user);
  } catch (error: any) {
    const status = error?.statusCode || 500;
    res.status(status).json(error);
  }
};
export const GET: RequestHandler = async (req, res) => {
  try {
    const users = await DBUser.getAllUsers();
    if (!users) {
      throw new Error("Não foi possivel buscar por usuarios");
    }
    res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

export const PUT = () => {};
