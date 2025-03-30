/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Rank` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Rank_name_key" ON "Rank"("name");
