import { Router } from "express";
import * as auth from "../controllers/auth";

export const authRoutes = Router();

// authRoutes.post("/auth/validate", auth.VALIDATE);

authRoutes.post("/auth/signin", auth.SIGNIN);
