import { RequestHandler, Response } from "express";
import { z } from "zod";
import { BadRequest, UnAuthorized, UserNotFound } from "../error";
import * as DBUser from "../model/users";
import jwt from "jsonwebtoken";
import { gerarToken } from "../services/jwt";
import { ExtendedRequest } from "../types/extended-request";

export const SIGNIN: RequestHandler = async (req, res) => {
  const userLoginSchema = z.object({
    email: z.string().email(),
    senha: z.string(),
  });

  try {
    const userLogin = userLoginSchema.safeParse(req.body);

    if (!userLogin.success) {
      throw new BadRequest();
    }

    const user = await DBUser.validateUser(userLogin.data);
    const JWT = gerarToken(user);

    res.json({ user: user, token: JWT });
  } catch (error: any) {
    const status = error?.statusCode || 500;
    res.status(status).json(error);
  }
};

export const VALIDATE = async (req: ExtendedRequest, res: Response) => {
  try {
    const user = req.user;
    console.log(user);

    if (!user) {
      throw new UnAuthorized("Token inválido ou expirado");
    }
    const userValid = await DBUser.getUserByID(user.id);
    console.log(userValid);

    if (!userValid) {
      throw new UnAuthorized("Token inválido ou expirado");
    }

    res.status(200).json(userValid);
  } catch (error: any) {
    const status = error?.statusCode || 500;
    res.status(status).json(error);
  }
};
