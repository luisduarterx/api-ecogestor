import { Request, Response, Router } from "express";
import { AuthMiddleware } from "../controllers/middleware";
import * as registro from "../controllers/registros";

export const registRoutes = Router();

registRoutes.get("/registros", AuthMiddleware, registro.GETS);
registRoutes.get("/registro", AuthMiddleware, registro.GET_PARAMS);
registRoutes.post("/registros/fisica", AuthMiddleware, registro.POST_F);

registRoutes.post("/registros/juridica", AuthMiddleware, registro.POST_J);

registRoutes.put("/registros/:regID", AuthMiddleware, registro.PUT);

registRoutes.delete("/registros/:regID", AuthMiddleware, registro.DELETE);
