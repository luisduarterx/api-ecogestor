import { Pool } from "pg"; // 1. Importe o Pool do pacote 'pg'
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// ADICIONE ESSA LINHA PARA TESTAR:

// 2. Crie a instância do Pool passando a string de conexão
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 3. Passe o pool para o adapter do Prisma
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
