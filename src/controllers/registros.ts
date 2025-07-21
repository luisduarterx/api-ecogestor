import { Response } from "express";
import { ExtendedRequest } from "../types/extended-request";
import { z } from "zod";
import { BadRequest } from "../error";
import {
  createNewF,
  createNewJ,
  deleteRegister,
  findAllRegisters,
  findRegister,
  updateRegister,
} from "../model/registros";

export const POST_F = async (req: ExtendedRequest, res: Response) => {
  try {
    const dataSchema = z.object({
      nome: z.string().min(6).toUpperCase(),
      cpf: z.string().regex(/^\d{11}$/, "CPF deve conter 11 dígitos"),
      nascimento: z.date().optional(),
      apelido: z.string().optional(),
      email: z.string().email().optional(),
      telefone: z.string().optional(),
      pagamento: z
        .object({
          banco: z.string().optional(),
          agencia: z.string().optional(),
          conta: z.string().optional(),
          cpf: z
            .string()
            .regex(/^\d{11}$/, "CPF do pagamento deve conter 11 dígitos")
            .optional(),
          pix: z.string().optional(),
        })
        .optional(),
      endereco: z
        .object({
          cep: z.string().max(8).optional(),
          estado: z
            .string()
            .regex(
              /^[A-Z]{2}$/,
              "UF deve conter exatamente duas letras maiúsculas"
            )
            .optional(),
          cidade: z.string().optional(),
          bairro: z.string().optional(),
          logradouro: z.string().optional(),
          numero: z.string().optional(),
          complemento: z.string().optional(),
        })
        .optional(),
    });
    const data = dataSchema.safeParse(req.body);

    if (!data.success) {
      console.log(data.error.message);
      throw new BadRequest();
    }

    const registro = await createNewF(data.data);

    res.status(201).json(registro);
  } catch (error: any) {
    console.log(error);
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
  }
};
export const POST_J = async (req: ExtendedRequest, res: Response) => {
  try {
    const dataSchema = z.object({
      razao: z.string().min(6).toUpperCase(),
      cnpj: z.string().regex(/^\d{14}$/, "CNPJ deve conter 14 dígitos"),
      ie: z.string().optional(),
      apelido: z.string().optional(),
      email: z.string().email().optional(),
      telefone: z.string().optional(),
      pagamento: z
        .object({
          banco: z.string().optional(),
          agencia: z.string().optional(),
          conta: z.string().optional(),
          cpf: z
            .string()
            .regex(/^\d{11}$/, "CPF do pagamento deve conter 11 dígitos")
            .optional(),
          pix: z.string().optional(),
        })
        .optional(),
      endereco: z
        .object({
          cep: z.string().max(8).optional(),
          estado: z
            .string()
            .regex(
              /^[A-Z]{2}$/,
              "UF deve conter exatamente duas letras maiúsculas"
            )
            .optional(),
          cidade: z.string().optional(),
          bairro: z.string().optional(),
          logradouro: z.string().optional(),
          numero: z.string().optional(),
          complemento: z.string().optional(),
        })
        .optional(),
    });
    const data = dataSchema.safeParse(req.body);

    if (!data.success) {
      console.log(data.error.message);
      throw new BadRequest();
    }

    const registro = await createNewJ(data.data);

    res.status(201).json(registro);
  } catch (error: any) {
    console.log(error);
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
  }
};
export const GET_PARAMS = async (req: ExtendedRequest, res: Response) => {
  try {
    const params = req.query.query as string;
    if (!params) {
      throw new BadRequest();
    }

    const registros = await findRegister(params);

    res.json(registros);
  } catch (error: any) {
    console.log(error);
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
  }
};
export const DELETE = async (req: ExtendedRequest, res: Response) => {
  try {
    const regIDSchema = z.number().int().max(2147483646);
    const regIDParsed = regIDSchema.safeParse(parseInt(req.params.regID));

    if (!regIDParsed.success) {
      throw new BadRequest();
    }

    const registro = await deleteRegister(regIDParsed.data);

    res.status(200).json(registro);
  } catch (error: any) {
    console.log(error);
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
  }
};
export const PUT = async (req: ExtendedRequest, res: Response) => {
  try {
    const regIDSchema = z.number().int().max(2147483646);
    const regIDParsed = regIDSchema.safeParse(parseInt(req.params.regID));

    if (!regIDParsed.success) {
      throw new BadRequest();
    }

    const dataSchema = z.object({
      nome_razao: z.string().min(6).toUpperCase().optional(),
      apelido: z.string().optional(),
      email: z.string().email().optional(),
      telefone: z.string().optional(),
      pagamento: z
        .object({
          banco: z.string().optional(),
          agencia: z.string().optional(),
          conta: z.string().optional(),
          cpf: z
            .string()
            .regex(/^\d{11}$/, "CPF do pagamento deve conter 11 dígitos")
            .optional(),
          pix: z.string().optional(),
        })
        .optional(),
      endereco: z
        .object({
          cep: z.string().max(8).optional(),
          estado: z
            .string()
            .regex(
              /^[A-Z]{2}$/,
              "UF deve conter exatamente duas letras maiúsculas"
            )
            .optional(),
          cidade: z.string().optional(),
          bairro: z.string().optional(),
          logradouro: z.string().optional(),
          numero: z.string().optional(),
          complemento: z.string().optional(),
        })
        .optional(),
    });
    const result = dataSchema.safeParse(req.body);

    if (!result.success) {
      throw new BadRequest();
    }

    const registro = await updateRegister(regIDParsed.data, result.data);

    res.status(200).json(registro);
  } catch (error: any) {
    console.log(error);
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
  }
};
export const GETS = async (req: ExtendedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string);
    const take =
      parseInt(req.query.take as string) ||
      parseInt(process.env.TAKE_REGS as string);

    if (!page) {
      throw new BadRequest("Voce deve escolher a pagina desejada.");
    }

    const registros = (await findAllRegisters(page, take)) as Array<any>;

    res.status(200).json(registros);
  } catch (error: any) {
    console.log(error);
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
  }
};
