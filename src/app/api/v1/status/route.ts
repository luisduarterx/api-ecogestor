import {
  getMaxConnections,
  getOppenedConnections,
  getServerVersion,
} from "infra/prisma";

export async function GET(request: Request) {
  const maxCnn: any = await getMaxConnections();
  const oppened: any = await getOppenedConnections();
  const serverVersion: any = await getServerVersion();

  return Response.json({
    updated_at: new Date().toISOString(),
    database: {
      server_version: serverVersion[0].server_version,
      max_connections: maxCnn[0].max_connections,
      open_connections: oppened[0].count,
    },
  });
}
