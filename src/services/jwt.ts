import jwt from "jsonwebtoken";
import { UnAuthorized } from "../error";
export const gerarToken = (payload: object) => {
  return jwt.sign(payload, process.env.JWT_KEY as string, {
    expiresIn: "1h",
  });
};

export const verificarToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_KEY as string);
  } catch (error) {
    throw new UnAuthorized("Token Invalido");
  }
};
