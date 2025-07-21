import { Router } from "express";
import { AuthMiddleware } from "../controllers/middleware";
import * as categorias from "../controllers/categorias";

export const categoriasRoutes = Router();

//Lida com as categorias
categoriasRoutes.get("/categorias", AuthMiddleware, categorias.GETS);
categoriasRoutes.get(
  "/categorias/:catID",
  AuthMiddleware,
  categorias.GET_UNIQUE
);

categoriasRoutes.post("/categorias", AuthMiddleware, categorias.POST);

categoriasRoutes.delete(
  "/categorias/:catID",
  AuthMiddleware,
  categorias.DELETE
);
