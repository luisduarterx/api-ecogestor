import { RequestHandler } from "express";
import { z } from "zod";
import { BadRequest, BaseError, InternalError, UserNotFound } from "../error";
import * as DBUser from "../model/users";
import { UserResult } from "../types/user";

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
export const DELETE: RequestHandler = async (req, res) => {
  try {
    const userID = parseInt(req.params.userID);

    const userIDSchema = z.number().int().max(2147483646);

    const userIDParsed = userIDSchema.safeParse(userID);

    if (!userIDParsed.success) {
      throw new UserNotFound("O ID informado não é valido");
    }

    const user = await DBUser.getUserByID(userIDParsed.data);
    if (!user) {
      throw new UserNotFound("O ID informado não pertence a nenhum usuário.");
    }

    const deletedUser = await DBUser.deleteUserByID(userIDParsed.data);
    res.status(200).json(deletedUser);
  } catch (error: any) {
    console.log(error);
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
  }
};
export const PUT: RequestHandler = async (req, res) => {
  try {
    const userID = parseInt(req.params.userID);
    console.log(userID);
    const userIDSchema = z.number().int().max(2147483646);
    const userIDParsed = userIDSchema.safeParse(userID);
    console.log(userIDParsed);
    if (!userIDParsed.success) {
      throw new UserNotFound("O ID informado não é valido");
    }

    const user: UserResult = await DBUser.getUserByID(userIDParsed.data);

    if (!user) {
      throw new UserNotFound();
    } //parei aqui

    const userDataSchema = z.object({
      email: z.string().email().optional(),
      telefone: z.string().optional(),
      cargoID: z.number().optional(),
    });
    const userData = userDataSchema.safeParse(req.body);

    if (!userData.success) {
      throw new BadRequest();
    }

    const updatedUser = await DBUser.editUserData({
      id: user.id,
      email: userData.data.email,
      cargoID: userData.data.cargoID,
      telefone: userData.data.telefone,
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
