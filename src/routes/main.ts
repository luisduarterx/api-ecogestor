import { Request, Response, Router } from "express";

export const mainRoutes = Router();

mainRoutes.get("/", async (req: Request, res: Response) => {
  res.json("API RODANDO...");
});
mainRoutes.get("/ping", (req: Request, res: Response) => {
  res.json({ pong: true });
});
