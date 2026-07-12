import { Response, Router } from "express";
import { transferencia } from "../controllers/financeiro";
import { AuthMiddleware } from "../controllers/middleware";
import { authorize } from "../controllers/auth-middleware";

export const finTransfRoutes = Router();

//Lida com o Cargos
finTransfRoutes.get(
  "/transferencia",
  AuthMiddleware,
  AuthMiddleware,
  authorize("read:contas"),
  transferencia.GET,
);
finTransfRoutes.get(
  "/transferencia/:id",
  AuthMiddleware,
  AuthMiddleware,
  authorize("read:contas"),
  transferencia.GET_UNIQUE,
);

finTransfRoutes.post(
  "/transferencia",

  AuthMiddleware,
  authorize("create:conta"),
  transferencia.POST,
);
finTransfRoutes.post(
  "/transferencia/estorno/:id",

  AuthMiddleware,
  authorize("create:conta"),
  transferencia.POST_ESTORNO,
);
