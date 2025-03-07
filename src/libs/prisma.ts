import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function getServerVersion() {
  const result = await prisma.$queryRaw`SHOW server_version;`;
  return result;
}

export async function getMaxConnections() {
  const result = await prisma.$queryRaw`SHOW max_connections`; // para PostgreSQL
  return result;
}
export async function getOppenedConnections() {
  const result =
    await prisma.$queryRaw`SELECT count(*)::int FROM pg_stat_activity WHERE datname='mydb';`;
  return result;
  console.log(result);
}
getOppenedConnections();
