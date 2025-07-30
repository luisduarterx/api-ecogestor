import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser, { urlencoded } from "body-parser";
import { mainRoutes } from "./routes/main";
import { usersRoutes } from "./routes/users";
import { authRoutes } from "./routes/auth";
import { cargosRoutes } from "./routes/cargos";
import { registRoutes } from "./routes/registros";
import { categoriasRoutes } from "./routes/categorias";
import { materiaisRoutes } from "./routes/materiais";
import { caixasRoutes } from "./routes/caixa";
import { movimRoutes } from "./routes/movFinanceiro";

const server = express();

server.use(cors());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use("/v1", mainRoutes);
server.use("/v1", usersRoutes);
server.use("/v1", authRoutes);
server.use("/v1", cargosRoutes);
server.use("/v1", registRoutes);
server.use("/v1", categoriasRoutes);
server.use("/v1", materiaisRoutes);
server.use("/v1", caixasRoutes);
server.use("/v1", movimRoutes);

server.listen(3000, () => {
  console.log("EcoGestor API rodando...");
});
