import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser, { urlencoded } from "body-parser";
import { mainRoutes } from "./routes/main";
import { usersRoutes } from "./routes/users";
import { authRoutes } from "./routes/auth";
import { cargosRoutes } from "./routes/cargos";

const server = express();

server.use(cors());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use("/v1", mainRoutes);
server.use("/v1", usersRoutes);
server.use("/v1", authRoutes);
server.use("/v1", cargosRoutes);

server.listen(3000, () => {
  console.log("EcoGestor API rodando...");
});
