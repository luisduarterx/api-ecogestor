import { Request, Response, Router } from "express";
import * as caixa from "../controllers/caixa";
import { AuthMiddleware } from "../controllers/middleware";
import { authorize } from "../controllers/auth-middleware";

export const caixasRoutes = Router();

//Lida com o Caixa
caixasRoutes.get(
  "/caixas/:caixaID",
  AuthMiddleware,

  caixa.GET
);

caixasRoutes.post("/caixas/abrir", AuthMiddleware, caixa.POST_A);

caixasRoutes.post(
  "/caixas/fechar",
  AuthMiddleware,

  caixa.POST_F
);
