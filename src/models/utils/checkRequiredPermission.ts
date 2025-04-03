import { NextResponse } from "next/server";
import { findUserFeatures, hasPermission } from "./hasPermission";

export async function checkRequiredPermission(
  request: Request,
  requiredPermission: string,
) {
  const userId = request.headers.get("user-id");

  if (!userId) {
    return NextResponse.json({ erro: "Nao autorizado" }, { status: 401 });
  }

  const user = await findUserFeatures(userId);

  if (!user) {
    return NextResponse.json(
      { erro: "Usuario não encontrado no banco" },
      { status: 401 },
    );
  }

  const userPermissions = user?.permissions.map((p) => p.name) ?? [];
  const result = await hasPermission(userPermissions, requiredPermission);
  if (!result) {
    return NextResponse.json(
      {
        error: true,
        message: `Verifique se o usuario tem a skill '${requiredPermission}' `,
      },
      { status: 401 },
    );
  }
}
