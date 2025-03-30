import { z } from "zod";

export const roleSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(3).max(30),
});
export const roleSchemaNOP = z.object({
  id: z.number(),
  name: z.string().min(3).max(30),
});
