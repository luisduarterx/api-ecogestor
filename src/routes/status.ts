import { Response, Router } from "express";
import * as status from "../controllers/status";
import { AuthMiddleware } from "../controllers/middleware";
import { MethodNotAllowedError, UnAuthorized } from "../error";

export const statusRouter = Router();

statusRouter
  .route("/status")
  .get(status.GET)
  .all(() => {
    throw new MethodNotAllowedError();
  });
