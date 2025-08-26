import { Request, Response, Router } from "express";

import * as P from "../controllers/pedidos";
import { AuthMiddleware } from "../controllers/middleware";
export const pedidosRoutes = Router();

//Lida com o Pedido
pedidosRoutes.get("/pedidos", AuthMiddleware, P.PED_GETS);
pedidosRoutes.get("/pedidos/:pedID", AuthMiddleware, P.PED_GET);

pedidosRoutes.post("/pedidos", AuthMiddleware, P.PED_POST);

pedidosRoutes.post("/pedidos/:pedID/reabrir", AuthMiddleware, P.PED_POST_REAB);
pedidosRoutes.post(
  "/pedidos/:pedID/finalizar",
  AuthMiddleware,
  P.PED_POST_FECHA
);
// excluir rascunho ou seja cancelar
pedidosRoutes.delete(
  "/pedidos/:pedID/cancelar",
  AuthMiddleware,
  P.PED_DEL_CANC
);
//deletar e estornar apos fechado
pedidosRoutes.post("/pedidos/:pedID", AuthMiddleware, P.PED_POST_ESTO);

// Lida com os itens do pedido

pedidosRoutes.get("/pedidos/:pedID/itens", AuthMiddleware, P.ITE_GET);

pedidosRoutes.post("/pedidos/:pedID/itens", AuthMiddleware, P.ITE_POST);

// pedidosRoutes.put("/pedidos/:pedID/itens/:itemID", AuthMiddleware, P.ITE_PUT);

pedidosRoutes.delete(
  "/pedidos/:pedID/itens/:itemID",
  AuthMiddleware,
  P.ITE_DEL
);

// Funçoes do pedido

pedidosRoutes.post(
  "/pedidos/:pedID/vincular-registro",
  AuthMiddleware,
  P.PED_POST_REGIS
);
