import { ExtendedRequest } from "../types/extended-request";
import { Response, NextFunction } from "express";
import user from "../model/users";

export function authorize(requiredPermissions: string) {
  return async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userPermission = await user.userHasPermission(
        req.user?.id,
        requiredPermissions,
      );

      if (!userPermission) {
        return res.status(401).json({
          nome: "Acesso não Autorizado",
          mensagem: "Você não tem permissão para acessar essa página",
          acao: "Verifique suas permissões ou contate um administrador",
          statusCode: 401,
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
