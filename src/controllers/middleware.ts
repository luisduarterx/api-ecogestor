import { NextFunction, RequestHandler, Response } from "express";
import { UnAuthorized } from "../error";
import { verificarToken } from "../services/jwt";
import { ReqUser, UserData } from "../types/user";
import { ExtendedRequest } from "../types/extended-request";
import { getUserByID } from "../model/users";

export const AuthMiddleware = async (
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];
  try {
    if (!token) {
      throw new UnAuthorized();
    }

    const user = verificarToken(token) as UserData;

    if (!user.id) {
      throw new UnAuthorized();
    }
    const userExist = await getUserByID(user.id);

    if (!userExist) {
      throw new UnAuthorized();
    }
    const RequestUser: ReqUser = {
      id: user.id,
      nome: user.nome,
      cargoID: user.cargo,
    };

    req.user = RequestUser;
    next();
  } catch (error: any) {
    const status = error?.statusCode || 500;

    res.status(status).json(error);
  }
};
