import jwt from "jsonwebtoken";

export async function generateToken(id: number) {
  const payload = {
    id: id,
  };
  return jwt.sign(payload, process.env.SECRET_JWT as string, {
    expiresIn: "10 minutes",
  });
}
export async function validateToken(token: string) {
  return jwt.verify(token, process.env.SECRET_JWT as string);
}
