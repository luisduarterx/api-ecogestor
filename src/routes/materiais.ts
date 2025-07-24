import { Request, Response, Router } from "express";
import * as materiais from "../controllers/materiais";
import { AuthMiddleware } from "../controllers/middleware";

export const materiaisRoutes = Router();

materiaisRoutes.get("/materiais", AuthMiddleware, materiais.GETS);

materiaisRoutes.post("/materiais", AuthMiddleware, materiais.POST);

materiaisRoutes.put("/materiais/:matID", AuthMiddleware, materiais.PUT);
