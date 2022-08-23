/*
  Warnings:

  - A unique constraint covering the columns `[type]` on the table `Source` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Source_type_key" ON "Source"("type");
