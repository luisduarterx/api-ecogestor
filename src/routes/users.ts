import { Request, Response, Router } from "express";
import { z } from "zod";
import * as user from "../controllers/users";
import { AuthMiddleware } from "../controllers/middleware";
import { MethodNotAllowedError } from "../error";

export const usersRoutes = Router();

usersRoutes.get("/usuarios", AuthMiddleware, user.GET);
usersRoutes.post("/usuarios", AuthMiddleware, user.POST);
//falta get usuario unico
usersRoutes.put("/usuarios/:userID", AuthMiddleware, user.PUT);

usersRoutes.delete("/usuarios/:userID", AuthMiddleware, user.DELETE);

usersRoutes.route("/usuarios").all(() => {
  throw new MethodNotAllowedError();
});
usersRoutes.route("/usuarios/:userID").all(() => {
  throw new MethodNotAllowedError();
});
