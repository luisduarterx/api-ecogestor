import { Response, Router } from "express";
import * as banco from "../controllers/bancos";
import { AuthMiddleware } from "../controllers/middleware";
import { authorize } from "../controllers/auth-middleware";

export const bancoRoutes = Router();

//Lida com o Cargos
bancoRoutes.get(
  "/bancos",
  AuthMiddleware,
  AuthMiddleware,
  authorize("read:bancos"),
  banco.GET,
);
bancoRoutes.patch(
  "/bancos/:bancoID",
  AuthMiddleware,
  AuthMiddleware,
  authorize("update:banco"),
  banco.PATCH,
);
bancoRoutes.get(
  "/bancos/:bancoID",
  AuthMiddleware,
  authorize("read:banco"),
  banco.GET_UNIQUE,
);

bancoRoutes.post(
  "/bancos",

  AuthMiddleware,
  authorize("create:banco"),
  banco.POST,
);

bancoRoutes.delete(
  "/bancos/:bancoID",
  AuthMiddleware,
  AuthMiddleware,
  authorize("delete:banco"),
  banco.DELETE,
);
