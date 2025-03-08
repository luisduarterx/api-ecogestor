import z from "zod";

export const UserSchema = z.object({
  id: z.number().optional(),
  nome: z.string(),
  email: z.string().email(),
  senha: z.string(),
  telefone: z.string().optional(),
  rankID: z.number().optional(),
});
