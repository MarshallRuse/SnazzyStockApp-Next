/*
  Warnings:

  - You are about to drop the column `targetPrice` on the `ProductInstance` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "targetPrice" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "ProductInstance" DROP COLUMN "targetPrice",
ALTER COLUMN "finalSalePrice" DROP NOT NULL,
ALTER COLUMN "finalSalePrice" DROP DEFAULT;
