import { Router } from "express";
import * as auth from "../controllers/auth";
import { AuthMiddleware } from "../controllers/middleware";

export const authRoutes = Router();

authRoutes.post("/auth/validate", AuthMiddleware, auth.VALIDATE);

authRoutes.post("/auth/signin", auth.SIGNIN);
