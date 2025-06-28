import { Request, Response, Router } from "express";
import { z } from "zod";
import * as user from "../controllers/users";
import { authorization } from "../controllers/middleware";

export const usersRoutes = Router();

// usersRoutes.get("/usuarios", async (req:Request,res:Response)=>{

// })
usersRoutes.post("/usuarios", authorization, user.POST);
// usersRoutes.put("/usuarios/:id", async (req:Request,res:Response)=>{

// })

// usersRoutes.delete("/usuarios/:id", async (req:Request,res:Response)=>{

// })
