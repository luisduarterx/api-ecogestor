import { EmailSchema } from "@/libs/zod/userSchema";
import { checkPassword } from "@/models/password";
import { generateToken, validateToken } from "@/models/session";
import { findUserByEmail } from "@/models/users";

export async function POST(request: Request) {
  try {
    const { email, senha } = await request.json();
    const emailValidation = EmailSchema.safeParse(email);

    if (!email || !senha || !emailValidation.success) {
      return new Response(
        JSON.stringify({ error: true, message: "Erro na validação dos dados" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const user = await findUserByEmail(email);

    if (!user || "error" in user) {
      return new Response(
        JSON.stringify({
          authentication: false,
          message: "E-mail ou senha incorreto.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const userValidation = await checkPassword(senha, user.senha as string);

    if (!userValidation) {
      return new Response(
        JSON.stringify({
          authentication: false,
          message: "E-mail ou senha incorreto.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    //gerar token com userID
    const token = await generateToken(user?.id as number);
    //redirecionar
    return new Response(JSON.stringify({ authentication: true, token: token }));
  } catch (error) {
    console.error("Erro no login:", error);
    return new Response(
      JSON.stringify({
        error: true,
        message: "Erro interno no servidor",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
