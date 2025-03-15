import { UserSchema } from "@/libs/zod/userSchema";
import { createUser, CreateUserResponse } from "@/models/users";

export async function POST(request: Request) {
  // Criar novo usuario
  try {
    const body = await request.json();
    console.log(body);
    const validation = UserSchema.safeParse(body);
    console.log(validation);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: true,
          message: "Não foi possivel validar os dados enviados.",
        }),
        { status: 400 },
      );
    }

    const user: CreateUserResponse = await createUser(body);

    if ("error" in user) {
      return new Response(JSON.stringify({ user }), {
        status: 400,
      });
    }
    return new Response(JSON.stringify(user), { status: 201 });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: true, message: "erro interno" }),
    );
  }
}
