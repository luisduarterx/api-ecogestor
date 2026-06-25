import { Request, Response, Router } from "express";
import { z } from "zod";
import * as user from "../controllers/users";
import { AuthMiddleware } from "../controllers/middleware";
import { MethodNotAllowedError } from "../error";
import { authorize } from "../controllers/auth-middleware";

export const usersRoutes = Router();

usersRoutes.get(
  "/usuarios",
  AuthMiddleware,
  authorize("read:usuarios"),
  user.GET,
);

usersRoutes.post(
  "/usuarios",
  AuthMiddleware,
  authorize("create:usuario"),
  user.POST,
);
usersRoutes.get(
  "/usuarios/:userID",
  AuthMiddleware,
  authorize("read:usuario"),
  user.GET_UNIQUE,
);
usersRoutes.patch(
  "/usuarios/:userID",
  AuthMiddleware,
  authorize("update:usuario"),
  user.PATCH,
);

usersRoutes.delete(
  "/usuarios/:userID",
  AuthMiddleware,
  authorize("delete:usuario"),
  user.DELETE,
);
// falta rota de troca de senha
usersRoutes.route("/usuarios").all(() => {
  throw new MethodNotAllowedError();
});
usersRoutes.route("/usuarios/:userID").all(() => {
  throw new MethodNotAllowedError();
});
