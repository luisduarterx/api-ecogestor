import { RequestHandler } from "express";
import { UnAuthorized } from "../error";
import { verificarToken } from "../services/jwt";
interface UserData {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cargo: number;
}
export const AuthMiddleware: RequestHandler = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  try {
    if (!token) {
      throw new UnAuthorized();
    }
    console.log(token);

    const user = verificarToken(token) as UserData;

    if (!user.id) {
      throw new UnAuthorized();
    }

    next();
  } catch (error: any) {
    const status = error?.statusCode || 500;
    res.status(status).json(error);
  }
};
