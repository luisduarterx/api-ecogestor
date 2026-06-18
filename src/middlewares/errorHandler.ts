import type { NextFunction, Request, Response } from "express";
import type { BaseError } from "../error";

export default function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Log básico do erro
  console.error("TA CHEGANDO ESSE ERRO", err);

  if (err && typeof err === "object" && "statusCode" in err) {
    const appErr = err as BaseError;
    const payload = {
      nome: appErr.nome,
      mensagem: appErr.mensagem,
      acao: appErr.acao,
      statusCode: appErr.statusCode,
    };
    return res.status(appErr.statusCode || 500).json(payload);
  }

  return res.status(500).json({
    nome: "InternalServerError",
    menssagem: "Um erro interno não esperado aconteceu.",
    acao: "Entre em contato com o suporte.",
    statusCode: 500,
  });
}
