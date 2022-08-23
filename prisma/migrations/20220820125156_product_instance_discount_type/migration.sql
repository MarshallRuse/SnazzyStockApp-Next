/*
  Warnings:

  - You are about to drop the column `discount` on the `SaleTransaction` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('ITEM', 'CART');

-- AlterTable
ALTER TABLE "ProductInstance" ADD COLUMN     "discountType" "DiscountType";

-- AlterTable
ALTER TABLE "SaleTransaction" DROP COLUMN "discount";
