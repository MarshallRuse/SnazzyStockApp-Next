import type { ProductInstance, Product } from "@prisma/client";
import type { IGroupedCartItem } from "lib/interfaces/IGroupedCartItem";

function groupCartItems(cartItems: (ProductInstance & { product: Product })[]): IGroupedCartItem[] {
    let groupedCartItems: IGroupedCartItem[] = [];
    cartItems.forEach((cartItem) => {
        if (groupedCartItems.filter((i) => i.sku === cartItem.product.sku).length === 0) {
            groupedCartItems.push({
                sku: cartItem.product.sku,
                productName: `${cartItem.product.name}${
                    cartItem.product.variationName && ` (${cartItem.product.variationName})`
                }`,
                typicalPrice: cartItem.product.targetPrice,
                instanceIds: [cartItem.id],
            });
        } else {
            groupedCartItems[groupedCartItems.findIndex((i) => i.sku === cartItem.product.sku)].instanceIds.push(
                cartItem.id
            );
        }
    });
    return groupedCartItems;
}

export default groupCartItems;
