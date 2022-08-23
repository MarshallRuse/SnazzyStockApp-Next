import { Product } from "@prisma/client";
import type { ProductInstanceWithSaleTransactionId } from "./ProductInstanceWithSaleTransactionId";

export type ProductWithInstanceStockData = Product & {
    productInstances: ProductInstanceWithSaleTransactionId[];
};
