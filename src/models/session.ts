import jwt from "jsonwebtoken";
import * as jose from "jose";

type UserPermissions = {
  name: string;
};
export async function generateToken(id: number) {
  const payload = {
    id,
  };
  return jwt.sign(payload, process.env.SECRET_JWT as string, {
    expiresIn: "5 hours",
  });
}
const jwtConfig = {
  secret: new TextEncoder().encode(process.env.SECRET_JWT),
};
export async function validateToken(token: string) {
  try {
    return await jose.jwtVerify(token, jwtConfig.secret);
  } catch (error) {
    let errorMessage = "Token inválido";

    if (error instanceof jose.errors.JWTExpired) {
      errorMessage = "Token expirado";
    } else if (error instanceof jose.errors.JWTInvalid) {
      errorMessage = "Token inválido";
    } else if (error instanceof jose.errors.JWSSignatureVerificationFailed) {
      errorMessage = "Assinatura do token inválida";
    } else if (error instanceof jose.errors.JWTClaimValidationFailed) {
      errorMessage = "Falha na validação das claims do token";
    } else {
      console.error("Erro desconhecido na validação do token:", error);
    }

    return { payload: { id: null, error: errorMessage, status: 403 } };
  }
}
