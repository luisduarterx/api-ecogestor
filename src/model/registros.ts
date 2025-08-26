import { BadRequest, InternalError, NotFound } from "../error";
import { Prisma } from "../generated/prisma";
import { prisma } from "../libs/prisma";
import { Pessoa, PessoaFisica, PessoaJuridica } from "../types/registros";
export const createNewF = (p: PessoaFisica) => {
  try {
    const result = prisma.$transaction(async (trx) => {
      try {
        const registro = await trx.registro.create({
          data: {
            nome_razao: p.nome,
            apelido: p.apelido,
            tipo: "FISICA",
            tabelaID: 1,
            email: p.email,
            telefone: p.telefone,
          },
        });

        const pessoa = await trx.pessoaFisica.create({
          data: {
            cpf: p.cpf,
            nascimento: p.nascimento ? p.nascimento : undefined,
            registroID: registro.id,
          },
        });
        if (p.pagamento) {
          await trx.dadosPagamento.create({
            data: {
              banco: p.pagamento?.banco,
              agencia: p.pagamento?.agencia,
              conta: p.pagamento?.conta,
              chave: p.pagamento?.pix,
              cpf: p.pagamento?.cpf,
              regID: registro.id,
            },
          });
        }
        if (p.endereco) {
          await trx.endereco.create({
            data: {
              regID: registro.id,
              cep: p.endereco.cep,
              estado: p.endereco.estado,
              cidade: p.endereco.cidade,
              logradouro: p.endereco.logradouro,
              complemento: p.endereco.complemento,
              numero: p.endereco.numero,
            },
          });
        }
        return registro;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2002") {
            return new BadRequest("Já existe um usuário com o CPF informado");
          }
          throw error;
        }
      }
    });
    return result;
    // criar registro
    //criar pf
    //criar banco
    //criar endereco
  } catch (error) {
    console.log("deu erro");
    throw error;
  }
};
export const createNewJ = (p: PessoaJuridica) => {
  try {
    const result = prisma.$transaction(async (trx) => {
      try {
        const registro = await trx.registro.create({
          data: {
            nome_razao: p.razao,
            apelido: p.apelido,
            tipo: "JURIDICA",
            tabelaID: 1,
            email: p.email,
            telefone: p.telefone,
          },
        });

        const pessoa = await trx.pessoaJuridica.create({
          data: {
            cnpj: p.cnpj,
            ie: p.ie,
            fantasia: p.apelido,
            registroID: registro.id,
          },
        });
        if (p.pagamento) {
          await trx.dadosPagamento.create({
            data: {
              banco: p.pagamento?.banco,
              agencia: p.pagamento?.agencia,
              conta: p.pagamento?.conta,
              chave: p.pagamento?.pix,
              cpf: p.pagamento?.cpf,
              regID: registro.id,
            },
          });
        }
        if (p.endereco) {
          await trx.endereco.create({
            data: {
              regID: registro.id,
              cep: p.endereco.cep,
              estado: p.endereco.estado,
              cidade: p.endereco.cidade,
              logradouro: p.endereco.logradouro,
              complemento: p.endereco.complemento,
              numero: p.endereco.numero,
            },
          });
        }
        return registro;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2002") {
            return new BadRequest("Já existe um usuário com o CNPJ informado");
          }
          throw error;
        }
      }
    });
    return result;
    // criar registro
    //criar pf
    //criar banco
    //criar endereco
  } catch (error) {
    console.log("deu erro");
    throw error;
  }
};
export const deleteRegister = async (id: number) => {
  try {
    const registro = await prisma.registro.update({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return registro;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new NotFound(
          "O id enviado não pertence a nenhum registro existente."
        );
      }
    }
    console.log(error);
    throw error;
  }
};

export const findRegister = async (params: string) => {
  try {
    const registros = prisma.registro.findMany({
      where: {
        deletedAt: null,
        OR: [
          { nome_razao: { contains: String(params), mode: "insensitive" } },
          {
            fisica: { cpf: { contains: String(params), mode: "insensitive" } },
          },
          {
            juridica: {
              cnpj: { contains: String(params), mode: "insensitive" },
            },
          },
          { apelido: { contains: String(params), mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        nome_razao: true,
      },
    });

    if (!registros) {
      return [];
    }
    return registros;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const updateRegister = async (id: number, data: Pessoa) => {
  try {
    const result = await prisma.$transaction(async (trx) => {
      try {
        const registro = await prisma.registro.update({
          where: { id, deletedAt: null },
          data: {
            nome_razao: data.nome_razao,
            apelido: data.apelido,
            email: data.email,
            telefone: data.telefone,
          },
          include: {
            dados_pagamento: data.pagamento ? true : false,
            endereco: data.endereco ? true : false,
          },
          omit: { deletedAt: true },
        });

        if (!registro) {
          throw new InternalError(
            "Houve um erro enquanto processavamos as informações"
          );
        }

        if (data.pagamento) {
          await prisma.dadosPagamento.upsert({
            where: { regID: id },
            update: {
              banco: data.pagamento.banco,
              agencia: data.pagamento.agencia,
              conta: data.pagamento.conta,
              cpf: data.pagamento.cpf,
              chave: data.pagamento.pix,
            },
            create: {
              regID: id,
              banco: data.pagamento.banco,
              agencia: data.pagamento.agencia,
              conta: data.pagamento.conta,
              cpf: data.pagamento.cpf,
              chave: data.pagamento.pix,
            },
          });
        }
        if (data.endereco) {
          await prisma.endereco.upsert({
            where: { regID: id },
            update: {
              cep: data.endereco.cep,
              estado: data.endereco.estado,
              cidade: data.endereco.cidade,
              bairro: data.endereco.bairro,
              logradouro: data.endereco.logradouro,
              numero: data.endereco.numero,
              complemento: data.endereco.complemento,
            },
            create: {
              regID: id,
              cep: data.endereco.cep,
              estado: data.endereco.estado,
              cidade: data.endereco.cidade,
              bairro: data.endereco.bairro,
              logradouro: data.endereco.logradouro,
              numero: data.endereco.numero,
              complemento: data.endereco.complemento,
            },
          });
        }

        return registro;
      } catch (error) {
        console.log(error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2025") {
            throw new BadRequest(
              "O id enviado não pertence a nenhum registro existente."
            );
          }
        }
      }
    });

    return result;
  } catch (error) {
    throw error;
  }
};
export const findAllRegisters = async (page: number, take: number) => {
  const skip = (page - 1) * take;
  try {
    const registros = await prisma.registro.findMany({
      where: { deletedAt: null },
      take,
      skip,
    });

    return registros;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const findRegisterByID = async (id: number) => {
  try {
    const registro = await prisma.registro.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        nome_razao: true,
        dados_pagamento: true,
        saldo: true,
        juridica: true,
        fisica: true,
        tipo: true,
      },
    });

    if (!registro) {
      throw new NotFound("Registro não encontrado!");
    }

    return registro;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
export const findRegisterTable = async (id: number) => {
  try {
    const regTable = await prisma.registro.findUnique({
      where: { id },
      select: { tabelaID: true },
    });

    if (!regTable) {
      throw new Error();
    }

    return regTable.tabelaID;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
