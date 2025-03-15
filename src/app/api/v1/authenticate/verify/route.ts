import { validateToken } from "@/models/session";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          authenticated: false,
          message: "Token não fornecido",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const token = authHeader.split(" ")[1];
    const validation = await validateToken(token);

    if (!validation.payload.id) {
      return new Response(
        JSON.stringify({
          authenticated: false,
          message: validation.payload.error,
        }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ authenticated: true, userId: validation.payload.id }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Erro na verificação do token:", error);
    return new Response(
      JSON.stringify({
        authenticated: false,
        message: "Erro interno no servidor",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
