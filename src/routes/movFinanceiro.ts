import { Request, Response, Router } from "express";
import * as mov from "../controllers/movFinanceiro";
import { AuthMiddleware } from "../controllers/middleware";
export const movimRoutes = Router();

//Lida com as movimentacoes

movimRoutes.post("/movimentacoes", AuthMiddleware, mov.POST);
movimRoutes.post("/movimentacoes/:movID", AuthMiddleware, mov.POST_EST);
