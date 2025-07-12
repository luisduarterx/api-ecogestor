-- DropForeignKey
ALTER TABLE "_UserPermissions" DROP CONSTRAINT "_UserPermissions_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserPermissions" DROP CONSTRAINT "_UserPermissions_B_fkey";

-- AddForeignKey
ALTER TABLE "_UserPermissions" ADD CONSTRAINT "_UserPermissions_A_fkey" FOREIGN KEY ("A") REFERENCES "Cargo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserPermissions" ADD CONSTRAINT "_UserPermissions_B_fkey" FOREIGN KEY ("B") REFERENCES "Permissoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
