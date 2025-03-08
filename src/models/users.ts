import { Prisma, User } from "@prisma/client";
import { prisma } from "infra/prisma";
export type CreateUserResponse = User | { error: boolean; message: string };

export async function createUser(data: any) {
  try {
    const user = await prisma.user.create({
      data: {
        name: data.nome,
        email: data.email,
        senha: data.senha,
        telefone: data.telefone || "",
        rankID: data.rankID || 1,
      },
    });
    console.log(user);
    return user;
  } catch (error) {
    console.log(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      let message: string;
      switch (error.code) {
        case "P2002":
          message = "Ja existe um usuario com esse email";
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
export async function findUserByEmail(email: string) {
  try {
    const user: User | null = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (user) {
      return user.id;
    }
  } catch (error) {}
}
