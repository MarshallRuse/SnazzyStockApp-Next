/*
  Warnings:

  - A unique constraint covering the columns `[HBCSku]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "HBCSku" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Product_HBCSku_key" ON "Product"("HBCSku");
