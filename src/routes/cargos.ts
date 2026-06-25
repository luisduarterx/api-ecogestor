import { Response, Router } from "express";
import * as cargo from "../controllers/cargos";
import { AuthMiddleware } from "../controllers/middleware";
import { authorize } from "../controllers/auth-middleware";

export const cargosRoutes = Router();

//Lida com o Cargos
cargosRoutes.get(
  "/cargos",
  AuthMiddleware,
  AuthMiddleware,
  authorize("read:cargos"),
  cargo.GET,
);
cargosRoutes.patch(
  "/cargos/:roleID",
  AuthMiddleware,
  AuthMiddleware,
  authorize("update:cargo"),
  cargo.PATCH,
);
cargosRoutes.get(
  "/cargos/:roleID",
  AuthMiddleware,
  authorize("read:cargo"),
  cargo.GETUNIQUE,
);

cargosRoutes.post(
  "/cargos",

  AuthMiddleware,
  authorize("create:cargo"),
  cargo.POST,
);

cargosRoutes.delete(
  "/cargos/:roleID",
  AuthMiddleware,
  AuthMiddleware,
  authorize("delete:cargo"),
  cargo.DELETE,
);
