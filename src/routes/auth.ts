import { Router } from "express";
import * as auth from "../controllers/auth";
import { MethodNotAllowedError } from "../error";
import { AuthMiddleware } from "../controllers/middleware";

export const authRoutes = Router();

authRoutes
  .route("/auth/validate")
  .post(AuthMiddleware, auth.VALIDATE)
  .all(() => {
    throw new MethodNotAllowedError();
  });

authRoutes
  .route("/auth/signin")
  .post(auth.SIGNIN)
  .all(() => {
    throw new MethodNotAllowedError();
  });
