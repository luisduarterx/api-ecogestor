import express from "express";
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
import { statusRouter } from "./routes/status";

import errorHandler from "./middlewares/errorHandler";
import { bancoRoutes } from "./routes/bancos";

export const app = express();

// ✅ liste os origins permitidos (dev e prod)
const allowedOrigins = [
  "http://localhost:3000",
  // "https://seu-front.com",
];

// ✅ CORS com credenciais + origin dinâmico
app.use(
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
  }),
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/v1", mainRoutes);
app.use("/v1", usersRoutes);
app.use("/v1", authRoutes);
app.use("/v1", cargosRoutes);
app.use("/v1", registRoutes);
app.use("/v1", categoriasRoutes);
app.use("/v1", materiaisRoutes);
app.use("/v1", caixasRoutes);
app.use("/v1", movimRoutes);
app.use("/v1", pedidosRoutes);
app.use("/v1", statusRouter);
app.use("/v1", bancoRoutes);
// ADICIONE ESSA LINHA PARA TESTAR:

app.use("/v1", errorHandler);
