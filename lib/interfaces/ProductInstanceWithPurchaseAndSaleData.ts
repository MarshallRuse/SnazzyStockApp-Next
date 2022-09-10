import { Prisma } from "@prisma/client";

const pi = Prisma.validator<Prisma.ProductInstanceArgs>()({
    include: {
        product: {
            include: {
                category: true,
            },
        },
        saleTransaction: true,
        purchaseOrder: true,
    },
});

export type ProductInstanceWithPurchaseAndSaleData = Prisma.ProductInstanceGetPayload<typeof pi>;
