import { EmailSchema } from "@/libs/zod/userSchema";
import { checkPassword } from "@/models/password";
import { findUserByEmail } from "@/models/users";

export async function POST(request: Request) {
  try {
    const { email, senha } = await request.json();
    const emailValidation = EmailSchema.safeParse(email);

    if (!email || !senha || !emailValidation.success) {
      return new Response(
        JSON.stringify({ error: true, message: "Erro na validação dos dados" }),
        { status: 400 },
      );
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return new Response(
        JSON.stringify({
          authentication: false,
          message: "E-mail ou senha incorreto.",
        }),
        { status: 403 },
      );
    }
    const userValidation = await checkPassword(senha, user?.senha as string);

    if (!userValidation) {
      return new Response(
        JSON.stringify({
          authentication: false,
          message: "E-mail ou senha incorreto.",
        }),
        {
          status: 403,
        },
      );
    }

    return new Response(
      JSON.stringify({ authentication: true, message: "Entrou" }),
    );
    //gerar token com userID

    //criar sessao

    //redirecionar
  } catch (error) {}
}
