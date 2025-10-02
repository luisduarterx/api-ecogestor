import { Response } from "express";
import { ExtendedRequest } from "../types/extended-request";
import { z } from "zod";
import { error } from "console";
import {
  BadRequest,
  InternalError,
  NotFound,
  NotPossible,
  UnAuthorized,
} from "../error";
import { findRegisterByID } from "../model/registros";
import {
  addNewItemOrder,
  closeOrder,
  createNewOrder,
  findOrderByID,
  removeItemOrder,
  vincularRegistro,
} from "../model/pedido";
import { User } from "../generated/prisma";
// criar pedido
export const PED_POST = async (req: ExtendedRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new UnAuthorized();
    }
    const userID = req.user.id;
    const schema = z.object({
      tipo: z.enum(["COMPRA", "VENDA"]),
      regID: z.number().int().max(2147483646).optional(),
    });
    const data = schema.safeParse(req.body);

    if (!data.success) {
      throw new BadRequest("Não conseguimos validar os campos enviados");
    }
    const regID = data.data.regID;
    const pedido = await createNewOrder({
      userID,
      tipo: data.data.tipo,
      regID: data.data.regID,
    });

    res.status(201).json(pedido);
  } catch (error: any) {
    console.log(error);
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
  }
};

//finalizar pedido
export const PED_POST_FECHA = async (req: ExtendedRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new Error();
    }
    const userID = req.user.id;
    const pagamento = req.body.pagamento;
    const baixarAgora = req.body.baixarAgora;
    const pedID = Number(req.params.pedID);
    const schema = z.object({
      userID: z.number().int().max(2147483646),
      pedID: z.number().int().max(2147483646),
      pagamento: z
        .array(
          z.object({
            metodo: z.enum(["DINHEIRO", "TRANSFERENCIA", "ABATER"]),
            valor: z.number().nonnegative().positive(),
          })
        )
        .nonempty("É necessário ao menos um meio de pagamento!"),
      baixarAgora: z.boolean().optional().default(false),
    });

    const safePedID = schema.safeParse({
      userID,
      pedID,
      pagamento,
      baixarAgora,
    });
    if (!safePedID.success) {
      console.log(safePedID.error);
      throw new BadRequest();
    }
    const pedido = await closeOrder(safePedID.data);

    res.json(pedido);
  } catch (error: any) {
    console.log(error);
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
  }
};
//listar itens pedido
export const PED_GET = async (req: ExtendedRequest, res: Response) => {};
//listar pedidos
export const PED_GETS = async (req: ExtendedRequest, res: Response) => {};
// reabrir pedido
export const PED_POST_REAB = async (req: ExtendedRequest, res: Response) => {};
// estornar pedido
export const PED_POST_ESTO = async (req: ExtendedRequest, res: Response) => {};
//excluir pedido
export const PED_DEL_CANC = async (req: ExtendedRequest, res: Response) => {};

export const PED_POST_REGIS = async (req: ExtendedRequest, res: Response) => {
  try {
    const pedID = parseInt(req.params.pedID as string);
    const regID = parseInt(req.body.regID as string);

    const dataSchema = z.object({
      pedID: z.number().int().max(2147483646),
      regID: z.number().int().max(2147483646).optional(),
    });
    const dataValidation = dataSchema.safeParse({ pedID, regID });
    if (!dataValidation.success) {
      throw new BadRequest();
    }

    // verifica se registro e pedido existe
    const pedido = await findOrderByID(pedID);

    if (!pedido) {
      throw new NotFound("Pedido não encontrado");
    }
    if (regID !== 0) {
      const registro = await findRegisterByID(regID);

      if (!registro) {
        throw new NotFound("Registro não encontrado");
      }
    }

    const pedidoAlterado = await vincularRegistro(pedID, regID);

    if (!pedidoAlterado) {
      throw new InternalError();
    }

    res.status(200).json(pedidoAlterado);
  } catch (error: any) {
    console.log(error);
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
  }
};
//incluir item
export const ITE_GET = async (req: ExtendedRequest, res: Response) => {};
export const ITE_POST = async (req: ExtendedRequest, res: Response) => {
  try {
    if (!req.user) {
      throw new UnAuthorized();
    }
    //verifica pedido
    const pedID = Number(req.params.pedID);
    const pedSchema = z.number().int().max(2147483646);
    const safePedID = pedSchema.safeParse(pedID);
    if (!safePedID.success) {
      throw new BadRequest();
    }
    const pedido = await findOrderByID(pedID);
    if (!pedido) {
      throw new NotPossible("Pedido não encontrado!");
    }
    if (pedido?.status !== "ABERTO") {
      throw new NotPossible("Esse pedido já foi fechado!");
    }

    //verifica item
    const baseSchema = z.object({
      materialID: z.number(),
      preco: z.number().optional(),
    });
    const pesagemSchema = z
      .object({
        pesoBruto: z.number().positive(),
        tara: z.number().nonnegative(),
        impureza: z.number().nonnegative(),
      })
      .refine((d) => d.pesoBruto >= d.tara, {
        message: "pesoBruto deve ser >= tara",
      });

    const itemPedidoSchema = z.discriminatedUnion("modo", [
      baseSchema.extend({
        modo: z.literal("QUANTIDADE"),
        quantidade: z.number().positive(),
      }),
      baseSchema.extend({ modo: z.literal("PESAGEM"), pesagem: pesagemSchema }),
    ]);
    const safeItemPedido = itemPedidoSchema.safeParse(req.body);
    if (!safeItemPedido.success) {
      console.log(safeItemPedido.error);
      throw new BadRequest();
    }
    const itemPedido = safeItemPedido.data;

    // cria item
    const data = {
      user: req.user,
      pedID: pedido.id,
      item: itemPedido,
    };
    const item = await addNewItemOrder(data);

    res.json(item);
  } catch (error: any) {
    console.log(error);
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
  }
};
//editar item
// export const ITE_PUT = async (req: ExtendedRequest, res: Response) => {};
//excluir item
export const ITE_DEL = async (req: ExtendedRequest, res: Response) => {
  try {
    const pedidoID = Number(req.params.pedID);
    const itemID = Number(req.params.itemID);
    console.log(pedidoID, itemID);
    const dataSchema = z.object({
      pedidoID: z.number().int().max(2147483646),
      itemID: z.number().int().max(2147483646),
    });
    const received = dataSchema.safeParse({ pedidoID, itemID });
    if (!received.success) {
      console.log(received.error);
      throw new BadRequest();
    }
    const data = received.data;

    const result = await removeItemOrder(data);

    res.status(200).json(result);
  } catch (error: any) {
    console.log(error);
    const status = error?.statusCode || 500;
    res.status(status).json(error);
    return;
  }
};
