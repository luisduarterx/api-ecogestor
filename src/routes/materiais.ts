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

materiaisRoutes.post(
  "/materiais",
  AuthMiddleware,
  authorize("create:material"),
  materiais.POST,
);

materiaisRoutes.put(
  "/materiais/:matID",
  AuthMiddleware,
  authorize("update:material"),
  materiais.PUT,
);
