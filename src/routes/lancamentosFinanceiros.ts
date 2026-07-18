import { Router } from "express";
import { lancamentos } from "../controllers/lancamentosFinanceiros";
import { authorize } from "../controllers/auth-middleware";
import { AuthMiddleware } from "../controllers/middleware";

export const lancamentosFinanceirosRoutes = Router();

lancamentosFinanceirosRoutes.post(
  "/lancamentos",
  AuthMiddleware,
  authorize("create:lancamento"),
  lancamentos.POST,
);
lancamentosFinanceirosRoutes.get(
  "/lancamentos",
  AuthMiddleware,
  authorize("read:lancamentos"),
  lancamentos.GET,
);
lancamentosFinanceirosRoutes.get(
  "/lancamentos/:id",
  AuthMiddleware,
  authorize("read:lancamento"),
  lancamentos.GET_UNIQUE,
);
lancamentosFinanceirosRoutes.patch(
  "/lancamentos/:id",
  AuthMiddleware,
  authorize("update:lancamento"),
  lancamentos.PATCH,
);
lancamentosFinanceirosRoutes.post(
  "/lancamentos/:id/baixar",
  AuthMiddleware,
  authorize("update:lancamento"),
  lancamentos.BAIXAR,
);
lancamentosFinanceirosRoutes.post(
  "/lancamentos/:id/cancelar",
  AuthMiddleware,
  authorize("update:lancamento"),
  lancamentos.CANCELAR,
);
lancamentosFinanceirosRoutes.post(
  "/lancamentos/:id/estornar",
  AuthMiddleware,
  authorize("update:lancamento"),
  lancamentos.ESTORNAR,
);
