/*
  Warnings:

  - Made the column `targetPrice` on table `ProductInstance` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ProductInstance" ALTER COLUMN "targetPrice" SET NOT NULL;
