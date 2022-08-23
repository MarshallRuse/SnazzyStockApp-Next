/*
  Warnings:

  - A unique constraint covering the columns `[date,supplierId]` on the table `PurchaseOrder` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_date_supplierId_key" ON "PurchaseOrder"("date", "supplierId");
