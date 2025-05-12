-- DropForeignKey
ALTER TABLE "ItemPedido" DROP CONSTRAINT "ItemPedido_pedidoID_fkey";

-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "atualizado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_pedidoID_fkey" FOREIGN KEY ("pedidoID") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;
