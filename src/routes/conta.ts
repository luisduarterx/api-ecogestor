import { Router } from "express";
import { conta } from "../controllers/financeiro";
import { AuthMiddleware } from "../controllers/middleware";
import { authorize } from "../controllers/auth-middleware";

export const contaRoutes = Router();

//Lida com o Cargos
contaRoutes.get(
  "/contas",
  AuthMiddleware,
  authorize("read:contas"),
  conta.GET,
);
contaRoutes.patch(
  "/contas/:id",
  AuthMiddleware,
  authorize("update:conta"),
  conta.PATCH,
);
contaRoutes.get(
  "/contas/:id",
  AuthMiddleware,
  authorize("read:conta"),
  conta.GET_UNIQUE,
);

contaRoutes.post(
  "/contas",

  AuthMiddleware,
  authorize("create:conta"),
  conta.POST,
);

contaRoutes.delete(
  "/contas/:id",
  AuthMiddleware,
  authorize("delete:conta"),
  conta.DELETE,
);
