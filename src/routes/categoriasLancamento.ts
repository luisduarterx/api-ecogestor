import { Router } from "express";
import { authorize } from "../controllers/auth-middleware";
import { categoriasLancamento } from "../controllers/categoriasLancamento";
import { AuthMiddleware } from "../controllers/middleware";

export const categoriasLancamentoRoutes = Router();

categoriasLancamentoRoutes.post(
  "/categorias-lancamento",
  AuthMiddleware,
  authorize("create:categoria_lancamento"),
  categoriasLancamento.POST,
);
categoriasLancamentoRoutes.get(
  "/categorias-lancamento",
  AuthMiddleware,
  authorize("read:categorias_lancamento"),
  categoriasLancamento.GET,
);
categoriasLancamentoRoutes.get(
  "/categorias-lancamento/:id",
  AuthMiddleware,
  authorize("read:categoria_lancamento"),
  categoriasLancamento.GET_UNIQUE,
);
categoriasLancamentoRoutes.patch(
  "/categorias-lancamento/:id",
  AuthMiddleware,
  authorize("update:categoria_lancamento"),
  categoriasLancamento.PATCH,
);
categoriasLancamentoRoutes.delete(
  "/categorias-lancamento/:id",
  AuthMiddleware,
  authorize("delete:categoria_lancamento"),
  categoriasLancamento.DELETE,
);
