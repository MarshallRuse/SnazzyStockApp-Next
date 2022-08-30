import { ProductCategory } from "@prisma/client";

export type ProductCategoryTree = ProductCategory & { children: ProductCategoryTree[]; productCount?: number };
