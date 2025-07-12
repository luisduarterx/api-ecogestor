import { Response, Router } from "express";
import * as cargo from "../controllers/cargos";
import { AuthMiddleware } from "../controllers/middleware";

export const cargosRoutes = Router();

//Lida com o Cargos
cargosRoutes.get("/cargos", AuthMiddleware, cargo.GET);

cargosRoutes.get("/cargos/:roleID", AuthMiddleware, cargo.GETUNIQUE);

cargosRoutes.post("/cargos", AuthMiddleware, cargo.POST);

cargosRoutes.delete("/cargos/:roleID", AuthMiddleware, cargo.DELETE);
