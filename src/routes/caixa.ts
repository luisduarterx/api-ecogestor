import { Router } from "express";
import { caixa } from "../controllers/financeiro";
import { AuthMiddleware } from "../controllers/middleware";
import { authorize } from "../controllers/auth-middleware";

export const caixasRoutes = Router();

//Lida com o Caixa
caixasRoutes.get(
  "/caixa/consulta",
  AuthMiddleware,
  authorize("read:caixa"),
  caixa.GET_CONSULTA,
);
caixasRoutes.get(
  "/caixa/:id",
  AuthMiddleware,
  authorize("read:caixa"),
  caixa.GET_UNIQUE,
);
caixasRoutes.get(
  "/caixas/",
  AuthMiddleware,
  authorize("read:caixas"),
  caixa.GET_UNIQUE,
);
caixasRoutes.post(
  "/caixa/abrir",
  AuthMiddleware,
  authorize("create:caixa"),
  caixa.POST,
);

caixasRoutes.post(
  "/caixa/fechar",
  AuthMiddleware,
  authorize("update:caixa"),
  caixa.POST_F,
);
