import { BadRequest, InternalError, NotFound, ValidationError } from "../error";
import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../libs/prisma";
import {
  Pessoa,
  PessoaFisica,
  PessoaJuridica,
  RegistroCreateInput,
  RegistroUpdateInput,
} from "../types/registros";
async function findDefaultTable() {
  const defaultTable = await prisma.tabela.findFirst({
    where: {
      nome: "PADRAO",
    },
  });
  if (!defaultTable?.id) {
    throw new InternalError(
      "O sistema não conseguiu encontrar a tabela 'PADRAO'.",
    );
  }
  return defaultTable;
}
const create = async (data: RegistroCreateInput) => {
  const defaultTable = await findDefaultTable();

  try {
    const novoRegistro = await prisma.$transaction(async (trx) => {
      let existRegistro;
      if (data.tipo === "FISICA") {
        existRegistro = await trx.pessoaFisica.findUnique({
          where: {
            cpf: data.cpf,
          },
        });
      } else {
        existRegistro = await trx.pessoaFisica.findUnique({
          where: {
            cpf: data.cnpj,
          },
        });
      }
      if (existRegistro?.id) {
        throw new ValidationError(
          `Já existe um registro com esse ${data.tipo === "JURIDICA" ? "cnpj" : "cpf"}.`,
        );
      }

      const registro = await trx.registro.create({
        include: {
          saldo: true,
          fisica: true,
          juridica: true,
          endereco: true,
          dados_pagamento: true,
        },
        data: {
          email: data.email,
          nome_razao: data.nome,
          apelido: data.apelido,
          tabelaID: data.tabelaID ?? defaultTable.id,
          telefone: data.telefone,
          tipo: data.tipo,
          dados_pagamento: data.pagamento
            ? {
                create: {
                  banco: data.pagamento.banco,
                  agencia: data.pagamento.agencia,
                  conta: data.pagamento.conta,
                  chave: data.pagamento.pix,
                  cpf: data.pagamento.cpf,
                },
              }
            : undefined,
          endereco: {
            create: data.endereco
              ? {
                  cep: data.endereco.cep,
                  logradouro: data.endereco.logradouro,
                  complemento: data.endereco.complemento,
                  cidade: data.endereco.cidade,
                  estado: data.endereco.estado,
                  numero: data.endereco.numero,
                  bairro: data.endereco.bairro,
                }
              : undefined,
          },
          fisica:
            data.tipo === "FISICA"
              ? {
                  create: {
                    cpf: data.cpf,
                    nascimento: data.nascimento,
                  },
                }
              : undefined,
          juridica:
            data.tipo === "JURIDICA"
              ? {
                  create: {
                    cnpj: data.cnpj,
                    ie: data.ie,
                  },
                }
              : undefined,
          saldo: {
            create: {
              saldo: 0,
            },
          },
        },
      });

      return registro;
    });

    return {
      id: novoRegistro.id,
      nome_razao: novoRegistro.nome_razao,
      apelido: novoRegistro.apelido,
      criadoEm: novoRegistro.criadoEm,
      tabelaID: novoRegistro.tabelaID,
      email: novoRegistro.email,
      telefone: novoRegistro.telefone,
      dados_pagamento: novoRegistro.dados_pagamento,
      saldo: {
        id: novoRegistro.saldo?.id,
        saldo: Number(novoRegistro.saldo?.saldo),
      },
      endereco: novoRegistro.endereco,
      fisica: novoRegistro.fisica,
      juridica: novoRegistro.juridica,
      tipo: novoRegistro.tipo,
    };
  } catch (error) {
    throw error;
  }
};
const deleteUnique = async (id: number) => {
  try {
    const regExist = await prisma.registro.findUnique({ where: { id } });

    if (!regExist?.id) {
      throw new NotFound();
    }
    const registro = await prisma.registro.update({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      id: registro.id,
      deleted_at: registro.deletedAt,
    };
  } catch (error) {
    throw error;
  }
};

const findRegister = async (params: string) => {
  try {
    const registros = await prisma.registro.findMany({
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
        tabelaID: true,
        nome_razao: true,
        tipo: true,
        fisica: true,
        juridica: true,
        apelido: true,
      },
    });

    return {};
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const update = async (id: number, data: RegistroUpdateInput) => {
  try {
    console.log("DATA CHEGOU", data);
    const result = await prisma.$transaction(async (trx) => {
      const regExist = await prisma.registro.findUnique({
        where: { id },
      });

      if (!regExist?.id) {
        throw new NotFound();
      }
      console.log("FOI ENCONTRADO!");

      const registro = await prisma.registro.update({
        where: { id },
        data: {
          nome_razao: data.nome,
          apelido: data.apelido,
          email: data.email,
          telefone: data.telefone,
          fisica: {
            update: {
              cpf: data.fisica?.cpf,
            },
          },
          juridica: {
            update: {
              cnpj: data.juridica?.cnpj,
              ie: data.juridica?.ie,
            },
          },

          dados_pagamento: data.pagamento
            ? {
                upsert: {
                  create: {
                    agencia: data.pagamento?.agencia,
                    banco: data.pagamento?.banco,
                    chave: data.pagamento?.pix,
                    conta: data.pagamento?.conta,
                    cpf: data.pagamento?.cpf,
                  },
                  update: {
                    agencia: data.pagamento?.agencia,
                    banco: data.pagamento?.banco,
                    chave: data.pagamento?.pix,
                    conta: data.pagamento?.conta,
                    cpf: data.pagamento?.cpf,
                  },
                },
              }
            : undefined,
          endereco: data.endereco
            ? {
                upsert: {
                  create: {
                    cep: data.endereco?.cep,
                    logradouro: data.endereco?.logradouro,
                    complemento: data.endereco?.complemento,
                    cidade: data.endereco?.cidade,
                    estado: data.endereco?.estado,
                    numero: data.endereco?.numero,
                    bairro: data.endereco?.bairro,
                  },
                  update: {
                    cep: data.endereco?.cep,
                    logradouro: data.endereco?.logradouro,
                    complemento: data.endereco?.complemento,
                    cidade: data.endereco?.cidade,
                    estado: data.endereco?.estado,
                    numero: data.endereco?.numero,
                    bairro: data.endereco?.bairro,
                  },
                },
              }
            : undefined,
        },
        include: {
          fisica: true,
          juridica: true,
          dados_pagamento: true,
          endereco: true,
          saldo: true,
        },
        omit: { deletedAt: true },
      });

      console.log(registro);
      return registro;
    });
    console.log("result", result);
    return {
      id: result.id,
      nome_razao: result.nome_razao,
      apelido: result.apelido,
      criadoEm: result.criadoEm,
      tabelaID: result.tabelaID,
      email: result.email,
      telefone: result.telefone,
      dados_pagamento: result.dados_pagamento,
      saldo: {
        id: result.saldo?.id,
        saldo: Number(result.saldo?.saldo),
      },
      endereco: result.endereco,
      fisica: result.fisica,
      juridica: result.juridica,
      tipo: result.tipo,
    };
  } catch (error) {
    throw error;
  }
};
const findAll = async (page: number, take: number, search?: string) => {
  // implementar meta com dados para o frontend
  const skip = (page - 1) * take;
  const filtro = search?.trim();
  try {
    const registros = await prisma.registro.findMany({
      where: {
        deletedAt: null,
        OR: filtro
          ? [
              {
                nome_razao: {
                  contains: filtro,
                  mode: "insensitive",
                },
              },
              {
                apelido: {
                  contains: filtro,
                  mode: "insensitive",
                },
              },
              {
                fisica: {
                  cpf: {
                    contains: filtro,
                    mode: "insensitive",
                  },
                },
              },
              {
                juridica: {
                  cnpj: {
                    contains: filtro,
                    mode: "insensitive",
                  },
                },
              },
            ]
          : undefined,
      },
      take,
      skip,
      orderBy: {
        nome_razao: "asc",
      },
      select: {
        id: true,
        nome_razao: true,
        apelido: true,
        email: true,
        telefone: true,
        tipo: true,
        tabelaID: true,
        criadoEm: true,
        tabela: true,
        fisica: {
          select: {
            cpf: true,
            nascimento: true,
          },
        },
        juridica: {
          select: {
            cnpj: true,
            ie: true,
          },
        },
      },
    });
    return registros.map((reg) => ({
      id: reg.id,
      nome: reg.nome_razao,
      apelido: reg.apelido,
      documento: reg.tipo === "FISICA" ? reg.fisica?.cpf : reg.juridica?.cnpj,
      tipo: reg.tipo,
      tabela: reg.tabela.nome,
      email: reg.email,
      telefone: reg.telefone,
      criado_em: reg.criadoEm,
    }));
  } catch (error) {
    console.log(error);
    throw error;
  }
};
const findSearch = async (take: number, search?: string) => {
  const filtro = search?.trim();
  try {
    const registros = await prisma.registro.findMany({
      where: {
        deletedAt: null,
        OR: filtro
          ? [
              {
                nome_razao: {
                  contains: filtro,
                  mode: "insensitive",
                },
              },
              {
                apelido: {
                  contains: filtro,
                  mode: "insensitive",
                },
              },
              {
                fisica: {
                  cpf: {
                    contains: filtro,
                    mode: "insensitive",
                  },
                },
              },
              {
                juridica: {
                  cnpj: {
                    contains: filtro,
                    mode: "insensitive",
                  },
                },
              },
            ]
          : undefined,
      },
      take,
      orderBy: {
        nome_razao: "asc",
      },
      select: {
        id: true,
        nome_razao: true,
        apelido: true,
        tipo: true,
        tabelaID: true,
        fisica: {
          select: {
            cpf: true,
            nascimento: true,
          },
        },
        juridica: {
          select: {
            cnpj: true,
            ie: true,
          },
        },
      },
    });
    return registros.map((reg) => ({
      id: reg.id,
      nome: reg.nome_razao,
      apelido: reg.apelido,
      documento: reg.tipo === "FISICA" ? reg.fisica?.cpf : reg.juridica?.cnpj,
      tipo: reg.tipo,
      tabelaID: reg.tabelaID,
    }));
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const getByID = async (id: number) => {
  try {
    const registro = await prisma.registro.findUnique({
      where: { id, deletedAt: null },
      include: {
        dados_pagamento: true,
        fisica: true,
        juridica: true,
        endereco: true,
        saldo: true,
        tabela: true,
      },
    });

    if (!registro) {
      throw new NotFound();
    }

    return {
      id: registro.id,
      nome: registro.nome_razao,
      apelido: registro.apelido,
      documento:
        registro.tipo === "FISICA"
          ? registro.fisica?.cpf
          : registro.juridica?.cnpj,
      ie: registro.tipo === "FISICA" ? null : registro.juridica?.ie,
      tipo: registro.tipo,
      tabela: registro.tabela,
      dados_pagamento: registro.dados_pagamento,
      endereco: registro.endereco,
      saldo: registro.saldo,
      email: registro.email,
      telefone: registro.telefone,
      criado_em: registro.criadoEm,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const findRegisterTable = async (id: number) => {
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

const registro = {
  create,
  getByID,
  findAll,
  deleteUnique,
  update,
  findSearch,
};
export default registro;
