import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
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
import { pedidosRoutes } from "./routes/pedidos";
import { popular } from "./inicial";

const server = express();

// ✅ liste os origins permitidos (dev e prod)
const allowedOrigins = [
  "http://localhost:3000",
  // "https://seu-front.com",
];

// ✅ CORS com credenciais + origin dinâmico
server.use(
  cors({
    origin: (origin, callback) => {
      // permite tools sem origin (Postman/curl) e checa lista
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin não permitido pelo CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    exposedHeaders: ["Set-Cookie"],
  })
);
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(cookieParser());
server.use("/v1", mainRoutes);
server.use("/v1", usersRoutes);
server.use("/v1", authRoutes);
server.use("/v1", cargosRoutes);
server.use("/v1", registRoutes);
server.use("/v1", categoriasRoutes);
server.use("/v1", materiaisRoutes);
server.use("/v1", caixasRoutes);
server.use("/v1", movimRoutes);
server.use("/v1", pedidosRoutes);

server.listen(4000, () => {
  console.log("EcoGestor API rodando...");
});
//server.use(popular);
