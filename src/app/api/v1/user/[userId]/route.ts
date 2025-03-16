import { findUserById } from "@/models/users";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: { userId: string } },
) {
  try {
    const id = Number(context.params.userId);
    if (!id || typeof Number(id) !== "number") {
      return new Response(
        JSON.stringify({ error: true, message: "usuário invalido" }),
        { status: 404 },
      );
    }

    const user = await findUserById(id);

    if (!user || "error" in user) {
      return new Response(
        JSON.stringify({ error: true, message: user.message }),
        { status: 404 },
      );
    }

    return new Response(JSON.stringify(user), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: true, message: "Erro interno do servidor" }),
      { status: 500 },
    );
  }
}
