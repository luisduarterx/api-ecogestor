import { Response } from "express";
import { ExtendedRequest } from "../types/extended-request";
import { z } from "zod";
import { BadRequest, InternalError, UnAuthorized } from "../error";
import { estornarMovimentacao, novaMovimentacao } from "../model/movFinanceiro";
import { Console } from "console";

export const POST = async (req: ExtendedRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new UnAuthorized();
    }

    const userID = req.user.id;
    const dataSchema = z.object({
      bancoID: z.number().int().max(2147483646).optional(),
      caixaID: z.number().int().max(2147483646),
      contaID: z.number().int().max(2147483646).optional(),
      categoriaID: z.number().int().max(2147483646).optional(),
      tipoMovimentacaoID: z.number().int().max(2147483646),
      valor: z.number().positive().nonnegative(),
      descricao: z.string().optional(),
    });
    const result = dataSchema.safeParse(req.body);

    if (!result.success) {
      console.log(result.error);
      throw new BadRequest();
    }
    const data = {
      bancoID: result.data?.bancoID,
      caixaID: result.data?.caixaID,
      contaID: result.data?.contaID,
      categoriaID: result.data?.categoriaID,
      tipoMovimentacaoID: result.data?.tipoMovimentacaoID,
      valor: result.data?.valor,
      descricao: result.data?.descricao,
      userID: userID,
    };
    const movim = await novaMovimentacao(data);

    res.status(201).json(movim);
  } catch (error: any) {
    console.log(error);
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
  }
};
export const POST_EST = async (req: ExtendedRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new UnAuthorized();
    }

    const userID = req.user.id;
    const movSchema = z.number().int().max(2147483646);
    const movID = movSchema.safeParse(Number(req.params.movID));
    console.log(movID.error);
    if (!movID.success) {
      throw new BadRequest();
    }

    const id = movID.data;

    const { motivo }: { motivo: string } = req.body;

    if (!motivo) {
      throw new BadRequest();
    }
    const estorno = await estornarMovimentacao({ id, motivo, userID });

    res.json(estorno);
  } catch (error: any) {
    console.log(error);
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
  }
};

export const GET = async (req: ExtendedRequest, res: Response) => {};
