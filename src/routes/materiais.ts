import { Request, Response, Router } from "express";
import * as materiais from "../controllers/materiais";
import { AuthMiddleware } from "../controllers/middleware";
import { authorize } from "../controllers/auth-middleware";

export const materiaisRoutes = Router();

materiaisRoutes.get(
  "/materiais",
  AuthMiddleware,
  authorize("read:materiais"),
  materiais.GETS,
);
materiaisRoutes.get(
  "/materiais/:matID",
  AuthMiddleware,
  authorize("read:material"),
  materiais.GET_UNIQUE,
);
materiaisRoutes.delete(
  "/materiais/:matID",
  AuthMiddleware,
  authorize("delete:material"),
  materiais.DELETE,
);

materiaisRoutes.post(
  "/materiais",
  AuthMiddleware,
  authorize("create:material"),
  materiais.POST,
);

materiaisRoutes.patch(
  "/materiais/:matID",
  AuthMiddleware,
  authorize("update:material"),
  materiais.PATCH,
);
