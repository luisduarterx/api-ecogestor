-- DropForeignKey
ALTER TABLE "Pedido" DROP CONSTRAINT "Pedido_regID_fkey";

-- AlterTable
ALTER TABLE "Pedido" ALTER COLUMN "regID" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_regID_fkey" FOREIGN KEY ("regID") REFERENCES "Registro"("id") ON DELETE SET NULL ON UPDATE CASCADE;
