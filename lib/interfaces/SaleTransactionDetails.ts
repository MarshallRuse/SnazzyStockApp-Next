import { Prisma } from "@prisma/client";

const st = Prisma.validator<Prisma.SaleTransactionArgs>()({
    include: {
        source: true,
        productInstances: {
            include: {
                product: {
                    include: {
                        category: true,
                    },
                },
                purchaseOrder: true,
            },
        },
    },
});

export type SaleTransactionDetails = Prisma.SaleTransactionGetPayload<typeof st>;
