import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "./models/session";
import { findUserById } from "./models/users";
import { findUserFeatures } from "./models/utils/hasPermission";

export async function middleware(request: NextRequest) {
  let authHeader = request.headers.get("Authorization");
  const url = new URL("/", request.url);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("🚫 Acesso Negado");
    return new NextResponse(
      JSON.stringify({ error: true, message: "Nao autorizado" }),
      { status: 403 },
    );
  }

  const token = authHeader.split(" ")[1];

  try {
    const tokenIsValid = await validateToken(token);

    if (!tokenIsValid.payload.id) {
      console.log("🚫 Acesso Negado");
      return new NextResponse(JSON.stringify({ tokenIsValid, token }), {
        status: 403,
      });
    }
    console.log("✅ Acesso Autorizado!");

    const requestHeader = new Headers(request.headers);
    requestHeader.set("user-id", String(tokenIsValid.payload.id));

    return NextResponse.next({
      request: {
        headers: requestHeader,
      },
    });
  } catch (error) {
    console.log("🚫 Acesso Negado");
    return new NextResponse(
      JSON.stringify({ error: true, message: "Erro interno no servidor" }),
      { status: 500 },
    );
  }
}

export const config = {
  matcher: ["/api/v1/user", "/api/v1/user/:patch*", "/api/v1/role"],
};
