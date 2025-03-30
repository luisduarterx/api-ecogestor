/*
  Warnings:

  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_rankID_fkey";

-- DropTable
DROP TABLE "Role";

-- CreateTable
CREATE TABLE "Rank" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Rank_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rank_name_key" ON "Rank"("name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_rankID_fkey" FOREIGN KEY ("rankID") REFERENCES "Rank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
