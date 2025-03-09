import bcrypt from "bcrypt";

export async function hashPassword(pass: string) {
  const saltRounds = 10; // Define o número de rounds para aumentar a segurança
  const hash = await bcrypt.hash(pass, saltRounds);
  return hash;
}

export async function checkPassword(pass: string, hash: string) {
  const result = await bcrypt.compare(pass, hash);
  return result;
}

export async function generateToken(id: number) {
  // criaçao do token
}
