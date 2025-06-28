import bcrypt from "bcrypt";

export const encriptarSenha = async (password: string) => {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);

  return hash;
};
