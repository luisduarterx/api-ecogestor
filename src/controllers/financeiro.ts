import { Response } from "express";
import { ExtendedRequest } from "../types/extended-request";
import { z } from "zod";
import { BadRequest, UnAuthorized } from "../error";
import contaFinanceira from "../model/contaFinanceira";
import transferenciaFinanceira from "../model/transferencia";
import caixaFinanceiro from "../model/caixa";

export const conta = {
  POST: async (req: ExtendedRequest, res: Response) => {
    try {
      const data = z
        .object({
          nome: z.string().toUpperCase().min(3),
          saldo_inicial: z.coerce.number().nonnegative(),
          conta_padrao: z.boolean().optional(),
        })
        .strict()
        .safeParse(req.body);

      if (!data.success) {
        throw new BadRequest();
      }

      const novaConta = await contaFinanceira.create(data.data);

      res.status(201).json(novaConta);
    } catch (error: unknown) {
      throw error;
    }
  },
  PATCH: async (req: ExtendedRequest, res: Response) => {
    try {
      const contaID = z.coerce
        .number()
        .positive()
        .int()
        .safeParse(req.params.id);

      const body = z
        .object({
          nome: z.string().toUpperCase().min(3).optional(),
          conta_padrao: z.boolean().optional(),
          status: z.boolean().optional(),
        })
        .strict()
        .safeParse(req.body);
      if (!body.success || !contaID.success) {
        throw new BadRequest();
      }

      const contaAtualizada = await contaFinanceira.update({
        id: contaID.data,
        data: body.data,
      });
      res.status(200).json(contaAtualizada);
    } catch (error: unknown) {
      throw error;
    }
  },
  GET: async (req: ExtendedRequest, res: Response) => {
    try {
      const contasEncontradas = await contaFinanceira.findAll();

      res.json(contasEncontradas);
    } catch (error: unknown) {
      throw error;
    }
  },
  GET_UNIQUE: async (req: ExtendedRequest, res: Response) => {
    try {
      const id = z.coerce.number().positive().safeParse(req.params.id);

      if (!id.success) {
        throw new BadRequest();
      }

      const contaEncontrada = await contaFinanceira.getByID(id.data);

      res.status(200).json(contaEncontrada);
    } catch (error) {
      throw error;
    }
  },
  DELETE: async (req: ExtendedRequest, res: Response) => {
    try {
      const id = z.coerce.number().positive().safeParse(req.params.id);
      if (!id.success) {
        throw new BadRequest();
      }

      const contaDeletada = await contaFinanceira.deleteUnique(id.data);

      res.status(200).json(contaDeletada);
    } catch (error) {
      throw error;
    }
  },
};
export const transferencia = {
  POST: async (req: ExtendedRequest, res: Response) => {
    try {
      const data = z
        .object({
          descricao: z.string().max(30).toUpperCase().optional(),
          valor: z.coerce.number().positive(),
          conta_origem_id: z.coerce.number().positive().int(),
          conta_destino_id: z.coerce.number().positive().int(),
        })
        .safeParse(req.body);

      if (!data.success) {
        throw new BadRequest();
      }
      if (!req.user?.id) {
        throw new UnAuthorized();
      }
      const novaTransferencia = await transferenciaFinanceira.create({
        ...data.data,
        user_id: req.user?.id,
      });

      res.status(201).json(novaTransferencia);
    } catch (error) {
      throw error;
    }
  },
  GET: async (req: ExtendedRequest, res: Response) => {
    try {
      const query = z
        .object({
          dataInicial: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
          dataFinal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        })
        .strict()
        .refine(
          ({ dataInicial, dataFinal }) =>
            !dataInicial || !dataFinal || dataInicial <= dataFinal,
        )
        .safeParse(req.query);

      if (!query.success) {
        throw new BadRequest();
      }
      if (!req.user?.id) {
        throw new UnAuthorized();
      }
      const transferenciasEncontradas = await transferenciaFinanceira.findAll({
        dataFinal: query.data.dataFinal,
        dataInicial: query.data.dataInicial,
      });

      res.status(200).json(transferenciasEncontradas);
    } catch (error) {
      throw error;
    }
  },
  GET_UNIQUE: async (req: ExtendedRequest, res: Response) => {
    try {
      const id = z.coerce.number().int().positive().safeParse(req.params.id);

      if (!id.success) {
        throw new BadRequest();
      }

      const transferenciaEncontrada = await transferenciaFinanceira.getByID(
        id.data,
      );

      res.status(200).json(transferenciaEncontrada);
    } catch (error) {
      throw error;
    }
  },
  POST_ESTORNO: async (req: ExtendedRequest, res: Response) => {
    try {
      const id = z.coerce.number().positive().int().safeParse(req.params.id);
      const data = z
        .object({
          motivo: z.string().max(30).min(3).toUpperCase(),
        })
        .safeParse(req.body);

      if (!data.success || !id.success) {
        throw new BadRequest();
      }
      if (!req.user?.id) {
        throw new UnAuthorized();
      }
      const transferenciaEstornada = await transferenciaFinanceira.reverse({
        ...data.data,
        id: id.data,
        user_id: req.user?.id,
      });
      res.status(201).json(transferenciaEstornada);
    } catch (error) {
      throw error;
    }
  },
};
export const caixa = {
  POST: async (req: ExtendedRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        throw new UnAuthorized();
      }
      const body = z
        .object({
          observacao: z.string().max(150).optional(),
        })
        .strict()
        .optional()
        .safeParse(req.body);

      if (!body.success) {
        throw new BadRequest();
      }

      const caixaAberto = await caixaFinanceiro.abrir({
        user_id: req.user.id,
        ...body.data,
      });

      res.status(201).json(caixaAberto);
    } catch (error) {
      throw error;
    }
  },
  POST_F: async (req: ExtendedRequest, res: Response) => {
    if (!req.user?.id) {
      throw new UnAuthorized();
    }

    const body = z
      .object({
        saldo_informado: z.union([
          z.number().nonnegative(),
          z.string().regex(/^\d+(?:\.\d{1,2})?$/),
        ]),
        motivo: z.string().max(250).optional(),
        observacao: z.string().max(250).optional(),
      })
      .strict()
      .safeParse(req.body);

    if (!body.success) {
      throw new BadRequest();
    }

    const caixaFechado = await caixaFinanceiro.fechar({
      ...body.data,
      user_id: req.user.id,
    });

    res.status(200).json(caixaFechado);
  },
  GET: async (req: ExtendedRequest, res: Response) => {
    const query = z
      .object({
        dataInicial: z.coerce.date().optional(),
        dataFinal: z.coerce.date().optional(),
      })
      .strict()
      .refine(
        ({ dataFinal, dataInicial }) =>
          !dataFinal || !dataInicial || dataInicial <= dataFinal,
        { message: "A data inicial deve ser anterior à data final." },
      )
      .safeParse(req.query);

    if (!query.success) {
      throw new BadRequest();
    }

    const caixas = await caixaFinanceiro.findAll(query.data);
    res.status(200).json(caixas);
  },
  GET_CONSULTA: async (req: ExtendedRequest, res: Response) => {
    try {
      const caixaAberto = await caixaFinanceiro.consultaFechamento();

      res.status(200).json(caixaAberto);
    } catch (error) {
      throw error;
    }
  },
  GET_UNIQUE: async (req: ExtendedRequest, res: Response) => {
    const id = z.coerce.number().int().positive().safeParse(req.params.id);

    if (!id.success) {
      throw new BadRequest();
    }

    const caixaEncontrado = await caixaFinanceiro.getByID(id.data);
    res.status(200).json(caixaEncontrado);
  },
};
