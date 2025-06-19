import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser, { urlencoded } from "body-parser";
import { mainRoutes } from "./routes/main";

const server = express();

server.use(cors());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use("/v1", mainRoutes);

server.listen(3000, () => {
  console.log("EcoGestor API rodando...");
});
