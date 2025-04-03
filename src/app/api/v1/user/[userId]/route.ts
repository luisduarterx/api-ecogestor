import { findUserById } from "@/models/users";
import { checkRequiredPermission } from "@/models/utils/checkRequiredPermission";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const userIdHeader = request.headers.get("user-id");

  if (userIdHeader !== (await params).userId) {
    const user = await checkRequiredPermission(request, "read:users");
    if (user instanceof Response) return user; // retorna erro se necessário
  }

  try {
    const id = Number((await params).userId);
    if (!id || typeof Number(id) !== "number") {
      return NextResponse.json(
        { error: true, message: "usuário invalido" },
        { status: 404 },
      );
    }

    const user = await findUserById(id);

    if (!user || "error" in user) {
      return NextResponse.json(
        { error: true, message: user.message },
        { status: 404 },
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: true, message: "Erro interno do servidor" }),
      { status: 500 },
    );
  }
}
