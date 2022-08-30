export interface IGroupedCartItem {
    sku: string;
    productName: string;
    targetPrice: number;
    image?: string;
    instanceIds: string[];
}
