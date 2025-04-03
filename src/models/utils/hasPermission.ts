import { prisma } from "infra/prisma";

export const findUserFeatures = async (id: string) => {
  const result = await prisma.user.findUnique({
    where: { id: Number(id) },
    include: { permissions: { select: { name: true } } },
  });

  return result;
};
export const hasPermission = async (
  userPermissions: String[],
  required: string,
) => {
  return userPermissions.includes(required);
};
