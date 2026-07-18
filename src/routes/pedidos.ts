import { Router } from "express";
import { authorize } from "../controllers/auth-middleware";
import { AuthMiddleware } from "../controllers/middleware";
import { pedidos } from "../controllers/pedidos";

export const pedidosRoutes = Router();

pedidosRoutes.post(
  "/pedidos",
  AuthMiddleware,
  authorize("create:pedido"),
  pedidos.POST,
);
pedidosRoutes.get(
  "/pedidos",
  AuthMiddleware,
  authorize("read:pedidos"),
  pedidos.GET,
);
pedidosRoutes.get(
  "/pedidos/:id",
  AuthMiddleware,
  authorize("read:pedido"),
  pedidos.GET_UNIQUE,
);
pedidosRoutes.patch(
  "/pedidos/:id/registro",
  AuthMiddleware,
  authorize("update:pedido"),
  pedidos.PATCH_REGISTRO,
);
pedidosRoutes.post(
  "/pedidos/:id/itens",
  AuthMiddleware,
  authorize("update:pedido"),
  pedidos.POST_ITEM,
);
pedidosRoutes.patch(
  "/pedidos/:id/itens/:itemId",
  AuthMiddleware,
  authorize("update:pedido"),
  pedidos.PATCH_ITEM,
);
pedidosRoutes.delete(
  "/pedidos/:id/itens/:itemId",
  AuthMiddleware,
  authorize("update:pedido"),
  pedidos.DELETE_ITEM,
);
pedidosRoutes.post(
  "/pedidos/:id/finalizar",
  AuthMiddleware,
  authorize("finalize:pedido"),
  pedidos.FINALIZAR,
);
pedidosRoutes.post(
  "/pedidos/:id/cancelar",
  AuthMiddleware,
  authorize("cancel:pedido"),
  pedidos.CANCELAR,
);
pedidosRoutes.post(
  "/pedidos/:id/reabrir",
  AuthMiddleware,
  authorize("reopen:pedido"),
  pedidos.REABRIR,
);
