import fs from "fs";
import path from "path";
import { PrismaClient, ProductVariationType, SaleTransactionStatus } from "@prisma/client";
import papa from "papaparse";
import dayjs from "dayjs";

const prisma = new PrismaClient();

const parseData = (content: string): Promise<unknown[]> => {
    try {
        const fileStream = fs.createReadStream(path.join(__dirname, "seed-data", content));
        return new Promise((resolve, reject) => {
            papa.parse(fileStream, {
                header: true,
                dynamicTyping: true,
                delimiter: ",",
                complete: (results) => {
                    if (results.errors.length > 0) {
                        console.log("parseData ERROR: ", results.errors);
                        reject(`parseData ERROR: ${results.errors}`);
                    }
                    console.log(`${results.data.length} rows parsed from ${content}`);
                    //console.log("results.data: ", results.data);
                    resolve(results.data);
                },
            });
        });
    } catch (err) {
        console.error(err);
    }
};

type UploadStatus = {
    status: "SUCCESS" | "FAILURE";
    errors: string | null;
};

const successAlert: UploadStatus = { status: "SUCCESS", errors: null };

const seedUsers = async (): Promise<UploadStatus> => {
    type UserRow = {
        Email: string;
    };

    try {
        const usersData = (await parseData("users.csv")) as UserRow[];
        for (const data of usersData) {
            const upsert = await prisma.user.upsert({
                where: {
                    email: data.Email,
                },
                update: {},
                create: {
                    email: data.Email,
                },
            });
            if (upsert) {
                console.log(`User ${upsert.email} successfully upserted`);
            }
        }
        return Promise.resolve(successAlert);
    } catch (err) {
        return Promise.reject({ status: "FAILURE", errors: `users.csv seeding error - ${JSON.stringify(err)}` });
    }
};

const seedCategories = async (): Promise<UploadStatus> => {
    type CategoryRow = {
        Name: string;
        Parent_Name: string;
    };

    try {
        const categoriesData = (await parseData("categories.csv")) as CategoryRow[];
        for (const data of categoriesData) {
            const upsert = await prisma.productCategory.upsert({
                where: {
                    name: data.Name,
                },
                update: {},
                create: {
                    name: data.Name,
                    parent: data.Parent_Name
                        ? {
                              connectOrCreate: {
                                  where: {
                                      name: data.Parent_Name,
                                  },
                                  create: {
                                      name: data.Parent_Name,
                                  },
                              },
                          }
                        : undefined,
                },
            });
            if (upsert) {
                console.log(`${upsert.name} successfully upserted`);
            }
        }
        return Promise.resolve(successAlert);
    } catch (err) {
        return Promise.reject({ status: "FAILURE", errors: `categories.csv seeding error - ${JSON.stringify(err)}` });
    }
};

const seedProducts = async (): Promise<UploadStatus> => {
    type ProductRow = {
        SKU: string;
        Name: string;
        Type: ProductVariationType;
        Variation_Name: string;
        Category: string;
        Target_Price: number;
        Image: string;
    };

    try {
        const productsData = (await parseData("products.csv")) as ProductRow[];

        for (const data of productsData) {
            const upsert = await prisma.product.upsert({
                where: {
                    sku: data.SKU,
                },
                update: {
                    variationName: data.Variation_Name,
                    parent:
                        data.Type === "VARIATION"
                            ? {
                                  connect: {
                                      sku: data.SKU.split("-")[0],
                                  },
                              }
                            : undefined,
                },
                create: {
                    sku: data.SKU,
                    name: data.Name,
                    type: data.Type,
                    variationName: data.Variation_Name,
                    category: {
                        connect: {
                            name: data.Category,
                        },
                    },
                    parent:
                        data.Type === "VARIATION"
                            ? {
                                  connect: {
                                      sku: data.SKU.split("-")[0],
                                  },
                              }
                            : undefined,
                    targetPrice: data.Target_Price,
                },
            });
            if (upsert) {
                console.log(`${upsert.name} successfully upserted`);
            }
        }
        return Promise.resolve(successAlert);
    } catch (err) {
        return Promise.reject({ status: "FAILURE", errors: `products.csv seeding error - ${JSON.stringify(err)}` });
    }
};

const seedSuppliers = async (): Promise<UploadStatus> => {
    type SupplierRow = {
        Name: string;
    };

    try {
        const suppliersData = (await parseData("suppliers.csv")) as SupplierRow[];
        console.log("suppliersData: ", suppliersData);
        for (const data of suppliersData) {
            const upsert = await prisma.supplier.upsert({
                where: {
                    name: data.Name,
                },
                update: {},
                create: {
                    name: data.Name,
                },
            });
            if (upsert) {
                console.log(`${upsert.name} successfully upserted`);
            }
        }
        return Promise.resolve(successAlert);
    } catch (err) {
        return Promise.reject({ status: "FAILURE", errors: `suppliers.csv seeding error - ${JSON.stringify(err)}` });
    }
};

const seedPurchaseOrders = async (): Promise<UploadStatus> => {
    type PurchaseOrderRow = {
        Date: string;
        Supplier: string;
    };

    try {
        const purchaseOrdersData = (await parseData("purchaseOrders.csv")) as PurchaseOrderRow[];
        for (const data of purchaseOrdersData) {
            const supplier = await prisma.supplier.findUnique({
                where: {
                    name: data.Supplier,
                },
            });
            if (supplier) {
                const upsert = await prisma.purchaseOrder.upsert({
                    where: {
                        dateSupplier: {
                            date: dayjs(data.Date).toDate(),
                            supplierId: supplier.id,
                        },
                    },
                    update: {},
                    create: {
                        date: dayjs(data.Date).toDate(),
                        supplier: {
                            connect: {
                                id: supplier.id,
                            },
                        },
                    },
                });
                if (upsert) {
                    console.log(`${upsert.date}-${upsert.supplierId} successfully upserted`);
                }
            }
        }
        return Promise.resolve(successAlert);
    } catch (err) {
        console.log(err);
        return Promise.reject({
            status: "FAILURE",
            errors: `purchaseOrders.csv seeding error - ${JSON.stringify(err)}`,
        });
    }
};

const seedCustomers = async (): Promise<UploadStatus> => {
    type CustomerRow = {
        First_Name: string;
        Last_Name: string;
        Email: string;
        Phone_Number: string;
        Address: string;
        City: string;
        Province_State: string;
        Country: string;
        Postal_Zip_Code: string;
    };

    try {
        const customersData = (await parseData("customers.csv")) as CustomerRow[];
        for (const data of customersData) {
            const upsert = await prisma.customer.upsert({
                where: {
                    id: `${data.First_Name}${data.Last_Name}`,
                },
                update: {},
                create: {
                    id: `${data.First_Name}${data.Last_Name}`,
                    firstName: data.First_Name,
                    lastName: data.Last_Name,
                },
            });
            if (upsert) {
                console.log(`${upsert.id} successfully upserted`);
            }
        }
        return Promise.resolve(successAlert);
    } catch (err) {
        return Promise.reject({ status: "FAILURE", errors: `customers.csv seeding error - ${JSON.stringify(err)}` });
    }
};

const seedSources = async (): Promise<UploadStatus> => {
    type SourceRow = {
        Type: string;
    };

    try {
        const sourcesData = (await parseData("sources.csv")) as SourceRow[];
        for (const data of sourcesData) {
            const upsert = await prisma.source.upsert({
                where: {
                    type: data.Type,
                },
                update: {},
                create: {
                    type: data.Type,
                },
            });
            if (upsert) {
                console.log(`${upsert.type} successfully upserted`);
            }
        }
        return Promise.resolve(successAlert);
    } catch (err) {
        return Promise.reject({ status: "FAILURE", errors: `sources.csv seeding error - ${JSON.stringify(err)}` });
    }
};

// Due to no unique columns for SaleTransactions other than id ('Time' of dateTime isn't required,
// so the only way to make status-dateTime, for example, unique qould be to artificially increment time),
// this table was first seeded with prisma.saleTransaction.create(), which was then edited to
// prisma.saleTransaction.upsert(), hence the Sale_Transaction_ID being in the seed-data CSV
const seedSaleTransactions = async (): Promise<UploadStatus> => {
    type SaleTransactionRow = {
        Sale_Transaction_ID: string;
        Status: SaleTransactionStatus;
        Date_Time: string;
        Location_Latitude: number;
        Location_Longitude: number;
        City: string;
        Province_State: string;
        Country: string;
        Customer_ID: string;
        Sales_Person_ID: string;
        Source_Type: string;
    };

    try {
        const saleTransactionsData = (await parseData("saleTransactions.csv")) as SaleTransactionRow[];
        const salesPerson = await prisma.user.findUnique({
            where: {
                email: "ruse.marshall@gmail.com",
            },
        });
        const sources = await prisma.source.findMany();

        for (const data of saleTransactionsData) {
            const upsert = await prisma.saleTransaction.upsert({
                where: {
                    id: data.Sale_Transaction_ID,
                },
                update: {},
                create: {
                    id: data.Sale_Transaction_ID,
                    status: data.Status,
                    dateTime: dayjs(data.Date_Time).toDate(),
                    locationLatitude: data.Location_Latitude,
                    locationLongitude: data.Location_Longitude,
                    city: data.City,
                    provinceState: data.Province_State,
                    country: data.Country,
                    customerId: data.Customer_ID,
                    salesPersonId: salesPerson.id,
                    sourceId: sources.find((src) => src.type === data.Source_Type)?.id,
                },
            });
            if (upsert) {
                console.log(`${upsert.status}-${upsert.dateTime} successfully upserted`);
            }
        }
        return Promise.resolve(successAlert);
    } catch (err) {
        return Promise.reject({
            status: "FAILURE",
            errors: `saleTransactions.csv seeding error - ${JSON.stringify(err)}`,
        });
    }
};

const seedProductInstancess = async (): Promise<UploadStatus> => {
    type ProductInstanceRow = {
        SKU: string;
        Invoice_Cost: number;
        Invoice_Currency: string;
        CAD_Conversion_Rate: number;
        Discount: number;
        Final_Sale_Price: number;
        Purchase_Date: string;
        Purchase_Supplier: string;
        Sale_Transaction_ID: string;
        Notes: string;
    };

    try {
        const productInstancesData = (await parseData("productInstances.csv")) as ProductInstanceRow[];
        const products = await prisma.product.findMany();
        const suppliers = await prisma.supplier.findMany();
        await prisma.productInstance.deleteMany();
        console.log("ProductInstance records deleted");

        for (const data of productInstancesData) {
            const upsert = await prisma.productInstance.create({
                data: {
                    product: {
                        connect: {
                            id: products.find((prod) => prod.sku === data.SKU)?.id,
                        },
                    },
                    invoiceCost: data.Invoice_Cost,
                    invoiceCurrency: data.Invoice_Currency,
                    CADConversionRate: data.CAD_Conversion_Rate,
                    discount: data.Discount,
                    finalSalePrice: data.Final_Sale_Price,
                    purchaseOrder: {
                        connect: {
                            dateSupplier: {
                                date: dayjs(data.Purchase_Date).toDate(),
                                supplierId: suppliers.find((s) => s.name === data.Purchase_Supplier)?.id,
                            },
                        },
                    },
                    saleTransaction: data.Sale_Transaction_ID
                        ? {
                              connect: {
                                  id: data.Sale_Transaction_ID,
                              },
                          }
                        : undefined,
                    notes: data.Notes,
                },
            });
            if (upsert) {
                console.log(`${upsert.id} successfully upserted`);
            }
        }
        return Promise.resolve(successAlert);
    } catch (err) {
        console.log(err);
        return Promise.reject({
            status: "FAILURE",
            errors: `productInstances.csv seeding error - ${JSON.stringify(err)}`,
        });
    }
};

async function main() {
    try {
        //let usersUploaded: UploadStatus;
        //let categoriesUploaded: UploadStatus;
        let productsUploaded: UploadStatus;
        // let suppliersUploaded: UploadStatus;
        // let purchaseOrdersUploaded: UploadStatus;
        // let customersUploaded: UploadStatus;
        // let sourcesUploaded: UploadStatus;
        // let saleTransactionsUploaded: UploadStatus;
        // let productInstancesUploaded: UploadStatus;

        // usersUploaded = await seedUsers();
        // categoriesUploaded = await seedCategories();
        // if (categoriesUploaded.status === "SUCCESS") {
        productsUploaded = await seedProducts();
        //}
        // suppliersUploaded = await seedSuppliers();
        // if (suppliersUploaded.status === "SUCCESS") {
        //     purchaseOrdersUploaded = await seedPurchaseOrders();
        // }
        // customersUploaded = await seedCustomers();
        // sourcesUploaded = await seedSources();
        // saleTransactionsUploaded = await seedSaleTransactions();
        // productInstancesUploaded = await seedProductInstancess();
        await prisma.$disconnect();
    } catch (err) {
        console.error(err);
        await prisma.$disconnect();
        process.exit(1);
    }
}

main();
