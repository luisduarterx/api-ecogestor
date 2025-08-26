/*
  Warnings:

  - The values [PAGO] on the enum `TipoStatusPedido` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TipoStatusPedido_new" AS ENUM ('ABERTO', 'FECHADO');
ALTER TABLE "Pedido" ALTER COLUMN "status" TYPE "TipoStatusPedido_new" USING ("status"::text::"TipoStatusPedido_new");
ALTER TYPE "TipoStatusPedido" RENAME TO "TipoStatusPedido_old";
ALTER TYPE "TipoStatusPedido_new" RENAME TO "TipoStatusPedido";
DROP TYPE "TipoStatusPedido_old";
COMMIT;

-- AlterTable
ALTER TABLE "Pedido" ALTER COLUMN "status" SET DEFAULT 'ABERTO',
ALTER COLUMN "atualizado" DROP DEFAULT;
