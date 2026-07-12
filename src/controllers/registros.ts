import { Response } from "express";
import { ExtendedRequest } from "../types/extended-request";
import { z } from "zod";
import { BadRequest } from "../error";
import registro from "../model/registro";
import { sk } from "@faker-js/faker";

const pessoa = z.object({
  nome: z.string().min(6).toUpperCase(),
  tabelaID: z.coerce.number().positive().int().optional(),
  apelido: z.string().toUpperCase().optional(),
  email: z.string().email().toLowerCase().optional(),
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
        .regex(/^[A-Z]{2}$/, "UF deve conter exatamente duas letras maiúsculas")
        .optional(),
      cidade: z.string().optional(),
      bairro: z.string().optional(),
      logradouro: z.string().optional(),
      numero: z.string().optional(),
      complemento: z.string().optional(),
    })
    .optional(),
});
const pessoaFisica = pessoa.extend({
  tipo: z.literal("FISICA"),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve conter 11 dígitos"),
  nascimento: z.coerce.date().optional(),
});
const pessoaJuridica = pessoa.extend({
  tipo: z.literal("JURIDICA"),
  cnpj: z.string().regex(/^\d{14}$/, "CNPJ deve conter 14 dígitos"),
  ie: z.string().optional(),
});

const registroSchema = z.discriminatedUnion("tipo", [
  pessoaFisica,
  pessoaJuridica,
]);

export const POST = async (req: ExtendedRequest, res: Response) => {
  try {
    const body = registroSchema.safeParse(req.body);
    if (!body.data) {
      console.log(body.error);
      console.log(body.error.message);
      throw new BadRequest();
    }

    const novoRegistro = await registro.create(body.data);

    res.status(201).json(novoRegistro);
  } catch (error) {
    throw error;
  }
};
// RETORNA LISTA DE REGISTROS
export const GET_LIST = async (req: ExtendedRequest, res: Response) => {
  try {
    const page = z.coerce.number().positive().int().safeParse(req.query.page);
    const take = z.coerce.number().positive().int().safeParse(req.query.take);

    const search = z.string().optional().safeParse(req.query.search);
    if (!search.success || !page.success || !take.success) {
      throw new BadRequest();
    }

    const registros = await registro.findAll(page.data, take.data, search.data);

    res.json(registros);
  } catch (error: any) {
    throw error;
  }
};
// RETORNA UM UNICO REGISTRO COM TODOS OS DADOS
export const GET = async (req: ExtendedRequest, res: Response) => {
  try {
    const regID = z.coerce
      .number()
      .int()
      .positive()
      .safeParse(req.params.regID);
    if (!regID.success) {
      throw new BadRequest();
    }

    const registroEncontrado = await registro.getByID(regID.data);

    res.json(registroEncontrado);
  } catch (error: any) {
    throw error;
  }
};
export const DELETE = async (req: ExtendedRequest, res: Response) => {
  try {
    const regID = z.coerce
      .number()
      .int()
      .positive()
      .safeParse(req.params.regID);
    if (!regID.success) {
      throw new BadRequest();
    }

    const registroDeletado = await registro.deleteUnique(regID.data);

    res.status(200).json(registroDeletado);
  } catch (error: any) {
    throw error;
  }
};
export const PATCH = async (req: ExtendedRequest, res: Response) => {
  try {
    const regID = z.coerce
      .number()
      .int()
      .positive()
      .safeParse(req.params.regID);

    if (!regID.success) {
      throw new BadRequest();
    }

    const dataSchema = z
      .object({
        nome: z.string().min(6).toUpperCase().optional(),
        tabelaID: z.coerce.number().int().positive().optional(),
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
                "UF deve conter exatamente duas letras maiúsculas",
              )
              .optional(),
            cidade: z.string().optional(),
            bairro: z.string().optional(),
            logradouro: z.string().optional(),
            numero: z.string().optional(),
            complemento: z.string().optional(),
          })
          .optional(),
        fisica: z
          .object({
            cpf: z
              .string()
              .regex(/^\d{11}$/, "CPF do pagamento deve conter 11 dígitos")
              .optional(),
          })
          .optional(),
        juridica: z
          .object({
            cnpj: z.string().regex(/^\d{14}$/, "CNPJ deve conter 14 dígitos"),
            ie: z.string().optional(),
          })
          .optional(),
      })
      .strict();
    const result = dataSchema.safeParse(req.body);

    if (!result.success) {
      throw new BadRequest();
    }

    const registroAtualizado = await registro.update(regID.data, result.data);
    console.log("retorno", registroAtualizado);

    res.status(200).json(registroAtualizado);
  } catch (error: any) {
    throw error;
  }
};
//RETORNA REGISTRO BUSCADO NA HORA DO PEDIDO
export const GET_SEARCH = async (req: ExtendedRequest, res: Response) => {
  try {
    const take = z.coerce.number().positive().int().safeParse(req.query.take);
    const search = z.string().optional().safeParse(req.query.search);

    if (!take.data || !search.data) {
      throw new BadRequest();
    }

    const registros = await registro.findSearch(take.data, search.data);

    res.status(200).json(registros);
  } catch (error: any) {
    throw error;
  }
};
