import { Response } from "express";
import { ExtendedRequest } from "../types/extended-request";
import { prisma } from "../libs/prisma";

export const GET = async (req: ExtendedRequest, res: Response) => {
  const db_version: any = await prisma.$queryRaw`show server_version;`;
  const connections: any =
    await prisma.$queryRaw`SELECT count(*)::int FROM pg_stat_activity WHERE datname = 'api-local';`;
  console.log(connections);
  return res.status(200).json({
    database: {
      versao: Number(db_version[0].server_version),
      conexoes_abertas: connections[0].count,
    },
  });
};
