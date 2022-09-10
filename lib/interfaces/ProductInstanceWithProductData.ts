import { Prisma } from "@prisma/client";

const pi = Prisma.validator<Prisma.ProductInstanceArgs>()({
    include: {
        product: {
            include: {
                category: true,
            },
        },
        purchaseOrder: true,
    },
});

export type ProductInstanceWithProductData = Prisma.ProductInstanceGetPayload<typeof pi>;
