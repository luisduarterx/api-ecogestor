import { Response } from "express";
import { ExtendedRequest } from "../types/extended-request";
import { z } from "zod";
import { BadRequest, UnAuthorized } from "../error";
import { abrirCaixa, consultaFechamento, fecharCaixa } from "../model/caixa";

export const POST_A = async (req: ExtendedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      throw new UnAuthorized();
    }

    const userID = req.user.id;

    const vInicialSchema = z.number().min(0);
    const valorInicial = vInicialSchema.safeParse(
      parseFloat(req.body.valorInicial)
    );
    if (!valorInicial.success) {
      throw new BadRequest();
    }

    const caixa = await abrirCaixa(userID, valorInicial.data);

    res.status(201).json(caixa);
  } catch (error: any) {
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
  }
};

export const POST_F = async (req: ExtendedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      throw new UnAuthorized();
    }

    const userID = req.user.id;
    const fechamento = await fecharCaixa(userID);
    res.json(fechamento);
  } catch (error: any) {
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
  }
};

export const GET = async (req: ExtendedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      throw new UnAuthorized();
    }

    const caixaID = parseInt(req.params.caixaID as string);
    const schema = z.number().int().max(2147483646).positive();
    const dataParsed = schema.safeParse(caixaID);
    console.log(caixaID);
    if (!dataParsed.success) {
      throw new BadRequest("ID do caixa inválido");
    }

    const userID = req.user.id;
    const fechamento = await consultaFechamento(caixaID, userID);
    res.json(fechamento);
  } catch (error: any) {
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
  }
};
