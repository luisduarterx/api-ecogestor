import { prisma } from "../libs/prisma";

export const findPriceOnTable = async (
  materialID: number,
  tabelaID: number
) => {
  try {
    const PriceInTable = await prisma.precoPorTabela.findFirst({
      where: { materialID, tabelaID },
      select: { v_compra: true },
    });

    return PriceInTable?.v_compra;
  } catch (error) {}
};
