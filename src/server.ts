import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser, { urlencoded } from "body-parser";

const server = express();

server.use(cors());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

server.get("/ping", (req: Request, res: Response) => {
  res.json({ pong: true });
});

server.listen(3000, () => {
  console.log("EcoGestor API rodando...");
});
