import { Request, Response, Router } from "express";
import { AuthMiddleware } from "../controllers/middleware";
import { authorize } from "../controllers/auth-middleware";
import * as tabelas from "../controllers/tabela";

export const tabelasRoutes = Router();

//Lida com as tabelas
tabelasRoutes.get(
  "/tabelas",
  AuthMiddleware,
  authorize("read:tabelas"),
  tabelas.GET,
);
tabelasRoutes.get(
  "/tabelas/:tabID",
  AuthMiddleware,
  authorize("read:tabela"),
  tabelas.GET_UNIQUE,
);

tabelasRoutes.post(
  "/tabelas",
  AuthMiddleware,
  authorize("create:tabelas"),
  tabelas.POST,
);

tabelasRoutes.patch(
  "/tabelas/:tabID",
  AuthMiddleware,
  authorize("update:tabelas"),
  tabelas.PATCH,
);

tabelasRoutes.delete(
  "/tabelas/:tabID",
  AuthMiddleware,
  authorize("delete:tabelas"),
  tabelas.DELETE,
);
