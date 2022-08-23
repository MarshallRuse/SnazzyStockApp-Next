import { Prisma } from "@prisma/client";

// For some reason I need to run these Prisma validations separately, as passing in
// one validated select and include in one GetPayload assertion would not return
// only the selected saleTransaction fields, but instead a whole SaleTransaction type.
// Additionally, I had to use SaleTransaction above ProductInstance, doing the other way
// around caused methods on Prisma to not be available (?)
const saleTransaction = Prisma.validator<Prisma.SaleTransactionArgs>()({
    select: {
        status: true,
        dateTime: true,
        customerId: true,
        salesPersonId: true,
        sourceId: true,
        locationLatitude: true,
        locationLongitude: true,
    },
});

type CreateSaleTransaction = Prisma.SaleTransactionGetPayload<typeof saleTransaction>;

const productInstance = Prisma.validator<Prisma.ProductInstanceArgs>()({
    select: {
        id: true,
        discount: true,
        discountType: true,
        finalSalePrice: true,
    },
});

type CreateProductInstances = Prisma.ProductInstanceGetPayload<typeof productInstance>;

export type CreateSaleTransactionWithProductInstances = CreateSaleTransaction & {
    productInstances: CreateProductInstances[];
};
