import { Router } from "express";
import { AuthMiddleware } from "../controllers/middleware";
import * as categorias from "../controllers/categorias";
import { authorize } from "../controllers/auth-middleware";

export const categoriasRoutes = Router();

//Lida com as categorias
categoriasRoutes.get(
  "/materiais/categorias",
  AuthMiddleware,
  authorize("read:categorias_materiais"),
  categorias.GETS,
);
categoriasRoutes.get(
  "/materiais/categorias/:catID",
  AuthMiddleware,
  authorize("read:categoria_materiais"),
  categorias.GET_UNIQUE,
);
categoriasRoutes.patch(
  "/materiais/categorias/:catID",
  AuthMiddleware,
  authorize("update:categoria_materiais"),
  categorias.PATCH,
);

categoriasRoutes.post(
  "/materiais/categorias",
  AuthMiddleware,
  authorize("create:categoria_materiais"),
  categorias.POST,
);

categoriasRoutes.delete(
  "/materiais/categorias/:catID",
  AuthMiddleware,
  authorize("delete:categoria_materiais"),
  categorias.DELETE,
);
