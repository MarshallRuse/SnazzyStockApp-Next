import { Prisma } from "@prisma/client";

const st = Prisma.validator<Prisma.SaleTransactionArgs>()({
    select: {
        id: true,
        dateTime: true,
        city: true,
        provinceState: true,
        country: true,
        source: {
            select: {
                type: true,
            },
        },
        productInstances: {
            select: {
                id: true,
                invoiceCostCAD: true,
                finalSalePrice: true,
            },
        },
    },
});

export type SaleTransactionSummary = Prisma.SaleTransactionGetPayload<typeof st>;
