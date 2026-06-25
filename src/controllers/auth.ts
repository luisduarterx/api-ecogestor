import { RequestHandler, Response } from "express";
import { z } from "zod";
import { BadRequest, UnAuthorized, UserNotFound } from "../error";
import user from "../model/users";
import jwt from "jsonwebtoken";
import { gerarToken } from "../services/jwt";
import { ExtendedRequest } from "../types/extended-request";

export const SIGNIN: RequestHandler = async (req, res, next) => {
  const userLoginSchema = z.object({
    email: z.string().email(),
    senha: z.string(),
  });

  try {
    const userLogin = userLoginSchema.safeParse(req.body);

    if (!userLogin.success) {
      throw new BadRequest();
    }

    const usuario = await user.validateUser(userLogin.data);
    const JWT = gerarToken(usuario);

    res.cookie("acess_token", JWT, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });

    res.json({ user: usuario, token: JWT });
  } catch (error: any) {
    next(error);
  }
};

export const VALIDATE = async (req: ExtendedRequest, res: Response) => {
  try {
    const usuario = req.user;

    if (!usuario) {
      throw new UnAuthorized("Token inválido ou expirado");
    }
    const userValid = await user.getUserByID(usuario.id);

    if (!userValid) {
      throw new UnAuthorized("Token inválido ou expirado");
    }

    res.status(200).json(userValid);
  } catch (error: any) {
    const status = error?.statusCode || 500;
    res.status(status).json(error);
  }
};
