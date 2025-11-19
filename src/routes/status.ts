import { Response, Router } from "express";
import * as status from "../controllers/status";
import { AuthMiddleware } from "../controllers/middleware";

export const statusRouter = Router();

statusRouter.get("/status", status.GET);
