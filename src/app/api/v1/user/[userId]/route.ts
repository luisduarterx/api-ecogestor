import { findUserById } from "@/models/users";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const id = Number((await params).userId);
    if (!id || typeof Number(id) !== "number") {
      return new NextResponse(
        JSON.stringify({ error: true, message: "usuário invalido" }),
        { status: 404 },
      );
    }

    const user = await findUserById(id);

    if (!user || "error" in user) {
      return new NextResponse(
        JSON.stringify({ error: true, message: user.message }),
        { status: 404 },
      );
    }

    return new NextResponse(JSON.stringify(user), { status: 200 });
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: true, message: "Erro interno do servidor" }),
      { status: 500 },
    );
  }
}
