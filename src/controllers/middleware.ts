import { NextFunction, RequestHandler, Response } from "express";
import { UnAuthorized } from "../error";
import { verificarToken } from "../services/jwt";
import { ReqUser, UserData } from "../types/user";
import { ExtendedRequest } from "../types/extended-request";
import user from "../model/users";

export const AuthMiddleware = async (
  req: ExtendedRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.split(" ")[1];
  try {
    if (!token) {
      throw new UnAuthorized();
    }

    const usuario = verificarToken(token) as UserData;

    if (!usuario.id) {
      throw new UnAuthorized();
    }
    const userExist = await user.getUserByID(usuario.id);

    if (!userExist) {
      throw new UnAuthorized();
    }

    const RequestUser: ReqUser = {
      id: usuario.id,
      nome: usuario.nome,
      cargoID: usuario.cargo,
    };

    req.user = RequestUser;

    next();
  } catch (error: any) {
    next(error);
  }
};
