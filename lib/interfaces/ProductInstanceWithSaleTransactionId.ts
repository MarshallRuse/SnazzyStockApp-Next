import { Prisma } from "@prisma/client";

const piST = Prisma.validator<Prisma.ProductInstanceArgs>()({
    select: {
        id: true,
        saleTransactionId: true,
    },
});

export type ProductInstanceWithSaleTransactionId = Prisma.ProductInstanceGetPayload<typeof piST>;
