import { ExtendedRequest } from "../types/extended-request";
import { Response, NextFunction } from "express";
import { userHasPermission } from "../model/users";

export function authorize(requiredPermissions: string) {
  return async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userPermission = await userHasPermission(
        req.user?.id,
        requiredPermissions,
      );
      console.log("HASPERMISSION", userPermission);
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
