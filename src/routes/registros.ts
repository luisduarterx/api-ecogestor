import { Request, Response, Router } from "express";
import { AuthMiddleware } from "../controllers/middleware";
import * as registro from "../controllers/registros";
import { authRoutes } from "./auth";
import { authorize } from "../controllers/auth-middleware";

export const registRoutes = Router();

registRoutes.get(
  "/registros",
  AuthMiddleware,
  authorize("read:registros"),
  registro.GET_LIST,
);
registRoutes.get(
  "/registros/search",
  AuthMiddleware,
  authorize("read:registro"),
  registro.GET_SEARCH,
);
registRoutes.get(
  "/registros/:regID",
  AuthMiddleware,
  authorize("read:registro"),
  registro.GET,
);
registRoutes.delete(
  "/registros/:regID",
  AuthMiddleware,
  authorize("delete:registros"),
  registro.DELETE,
);

registRoutes.post(
  "/registros",
  AuthMiddleware,
  authorize("create:registros"),
  registro.POST,
);
registRoutes.patch(
  "/registros/:regID",
  AuthMiddleware,
  authorize("update:registros"),
  registro.PATCH,
);

registRoutes.delete("/registros/:regID", AuthMiddleware, registro.DELETE);
