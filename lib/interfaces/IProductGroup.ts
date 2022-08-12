import { Product, ProductVariationType } from "@prisma/client";

export interface IProductGroup {
    groupSKU: string;
    groupType: ProductVariationType;
    groupName: string;
    groupImage?: string;
    variations?: Product[];
}
