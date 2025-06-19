import { Request, Response, Router } from "express";
import { z } from "zod";
import { createUser } from "../controllers/users";

export const usersRoutes = Router();

// usersRoutes.get("/usuarios", async (req:Request,res:Response)=>{

// })
usersRoutes.post("/usuarios", async (req: Request, res: Response) => {
  const userSchema = z.object({
    nome: z.string(),
    email: z.string().email().toLowerCase(),
    senha: z.string(),
    telefone: z.string().optional(),
    cargo: z.number(),
  });

  const newUser = userSchema.safeParse(req.body);

  if (!newUser.success) {
    //error
    res.status(400).json({
      nome: "ErroValidacao",
      mensagem: "Erro na validação dos campos enviados",
      acao: "Verifique os campos e tente novamente",
    });
    return;
  }

  const user: any = await createUser(newUser.data);
  // criar type do user

  if (!user.email) {
    res.status(400).json(user);
    return;
  }
  res.status(201).json(user);
  return;
});
// usersRoutes.put("/usuarios/:id", async (req:Request,res:Response)=>{

// })

// usersRoutes.delete("/usuarios/:id", async (req:Request,res:Response)=>{

// })
