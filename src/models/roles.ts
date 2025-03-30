import { Prisma } from "@prisma/client";
import { prisma } from "infra/prisma";

export async function createRole(name: string) {
  try {
    const role = await prisma.rank.create({
      data: {
        name,
      },
    });
    console.log(role);
    return role;
  } catch (error) {
    console.log(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      let message: string;
      switch (error.code) {
        case "P2002":
          message = "Ja existe um cargo com esse nome";
          break;

        case "P2003":
          message = "Associaçao inexistente";
          break;
        default:
          message = "Erro desconhecido no banco de dados";
      }
      return { error: true, message };
    }
    return { error: true, message: "erro desconhecidos" };
  }
}
export async function editRole(id: number, name: string) {
  try {
    const role = await prisma.rank.update({ where: { id }, data: { name } });

    return role;
  } catch (error) {
    console.log(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      let message: string;
      switch (error.code) {
        case "P2002":
          message = "Ja existe um cargo com esse nome";
          break;

        case "P2025":
          message = "Não foi possivel alterar esse cargo";
          break;

        case "P2003":
          message = "Associaçao inexistente";
          break;
        default:
          message = "Erro desconhecido no banco de dados";
      }
      return { error: true, message };
    }
    return { error: true, message: "erro desconhecidos" };
  }
}
export async function deleteRole(id: number) {
  try {
    const role = await prisma.rank.delete({ where: { id } });
    return role;
  } catch (error) {
    console.log(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      let message: string;
      switch (error.code) {
        case "P2002":
          message = "Ja existe um cargo com esse nome";
          break;

        case "P2003":
          message = "Associaçao inexistente";
          break;
        default:
          message = "Erro desconhecido no banco de dados";
      }
      return { error: true, message };
    }
    return { error: true, message: "erro desconhecidos" };
  }
}
export async function listRoles() {
  const roles = prisma.rank.findMany();
  return roles;
  console.log(roles);
}
