import { Request, Response, Router } from "express";
import { z } from "zod";
import * as user from "../controllers/users";
import { AuthMiddleware } from "../controllers/middleware";

export const usersRoutes = Router();

usersRoutes.get("/usuarios/", AuthMiddleware, user.GET);
usersRoutes.post("/usuarios", AuthMiddleware, user.POST);
// usersRoutes.put("/usuarios/:id", async (req:Request,res:Response)=>{

// })

// usersRoutes.delete("/usuarios/:id", async (req:Request,res:Response)=>{

// })
