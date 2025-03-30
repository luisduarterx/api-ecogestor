import { roleSchema, roleSchemaNOP } from "@/libs/zod/Schemas";
import { createRole, editRole, listRoles } from "@/models/roles";
import { Rank } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    const nameValidation = roleSchema.safeParse({ name });
    if (!name || typeof name !== "string" || !nameValidation.success) {
      return new Response(
        JSON.stringify({
          error: true,
          message: "Não foi possivel validar os dados enviados!",
        }),
      );
    }
    const newrole = await createRole(nameValidation.data.name);
    return new Response(JSON.stringify(newrole));
  } catch (error) {
    console.log(error);
    return new Response(
      JSON.stringify({ error: true, message: "Erro interno no servidor" }),
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, name } = await request.json();

    const nameValidation = roleSchemaNOP.safeParse({ id, name });

    if (
      !name ||
      typeof name !== "string" ||
      typeof id !== "number" ||
      !nameValidation.success
    ) {
      return new Response(
        JSON.stringify({
          error: true,
          message: "Não foi possivel validar os dados enviados!",
        }),
        { status: 400 },
      );
    }

    const newrole = await editRole(
      nameValidation.data.id,
      nameValidation.data.name,
    );

    return new Response(JSON.stringify(newrole));
  } catch (error) {
    console.log(error);
    return new Response(
      JSON.stringify({ error: true, message: "Erro interno no servidor" }),
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const Roles: Rank[] = await listRoles();
    if (Roles.length <= 0 || !Roles) {
      return new Response(
        JSON.stringify({
          error: false,
          message: "não há nenhum registro para exibir",
        }),
      );
    }
    return new Response(JSON.stringify(Roles));
  } catch (error) {}
}
