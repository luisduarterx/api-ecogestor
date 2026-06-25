import type { NextFunction, Request, Response } from "express";
import type { BaseError } from "../error";
import { Prisma } from "../../generated/prisma/client";

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
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    console.log("PRISMA:", err.message);
    const payload = {
      nome: "ValidationError",
      mensagem: "Um erro de validação ocorreu ao processar a operação.",
      acao: "Verifique os dados e tente novamente, caso persista, contate um administrador.",
      statusCode: 400,
    };

    return res.status(payload.statusCode || 500).json(payload);
  }

  return res.status(500).json({
    nome: "InternalServerError",
    menssagem: "Um erro interno não esperado aconteceu.",
    acao: "Entre em contato com o suporte.",
    statusCode: 500,
  });
}
