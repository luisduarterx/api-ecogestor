import { UserSchema } from "@/libs/zod/userSchema";
import {
  createUser,
  CreateUserResponse,
  deleteUser,
  DeleteUserResponse,
  findUserById,
} from "@/models/users";
import { checkRequiredPermission } from "@/models/utils/checkRequiredPermission";
import { hasPermission } from "@/models/utils/hasPermission";
import { prisma } from "infra/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const user = await checkRequiredPermission(request, "create:user");
  if (user instanceof Response) return user; // retorna erro se necessário

  try {
    const body = await request.json();
    console.log(body);
    const validation = UserSchema.safeParse(body);
    console.log(validation);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: true,
          message: "Não foi possivel validar os dados enviados.",
        },
        { status: 400 },
      );
    }

    const user: CreateUserResponse = await createUser(body);

    if ("error" in user) {
      return NextResponse.json(
        { user },
        {
          status: 400,
        },
      );
    }
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: true, message: "erro interno" },
      { status: 500 },
    );
  }
}
export async function DELETE(request: Request) {
  const userIDHeader = request.headers.get("user-id");
  const { userID } = await request.json();

  if (Number(userIDHeader) !== Number(userID)) {
    const user = await checkRequiredPermission(request, "delete:user");
    if (user instanceof Response) return user; // retorna erro se necessário
  } else {
    // aqui eu preciso encerrar a sessão do individuo e invalidar o token
  }

  try {
    if (!userID || typeof userID !== "number") {
      return NextResponse.json(
        { error: true, message: "usuário invalido" },
        { status: 404 },
      );
    }
    const user: DeleteUserResponse = await deleteUser(userID);

    if (!user || "error" in user) {
      return NextResponse.json({ user }, { status: 403 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error });
  }
}
export async function PUT(request: Request) {}
