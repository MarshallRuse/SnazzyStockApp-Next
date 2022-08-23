import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { Prisma } from "@prisma/client";
import { prisma } from "lib/prisma";
import { CreateSaleTransactionWithProductInstances } from "lib/interfaces/CreateSaleTransactionWithProductInstances";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Check if user is authenticated
    const session = await getSession({ req });
    if (!session) {
        return res.status(401).json({ message: "Unauthorized." });
    }

    if (req.method === "GET") {
        const saleTransactionWithProductInstances = Prisma.validator<Prisma.SaleTransactionArgs>()({
            include: {
                productInstances: true,
            },
        });
        type SaleTransactionWithProductInstances = Prisma.SaleTransactionGetPayload<
            typeof saleTransactionWithProductInstances
        >;

        let saleTransactions: SaleTransactionWithProductInstances[];

        const { status } = req.query;
        try {
            if (status === "OPEN") {
                saleTransactions = await prisma.saleTransaction.findMany({
                    where: {
                        status: "OPEN",
                    },
                    include: {
                        productInstances: {
                            include: {
                                product: true,
                            },
                        },
                    },
                });
            } else if (status === "COMPLETE") {
                saleTransactions = await prisma.saleTransaction.findMany({
                    where: {
                        status: "COMPLETE",
                    },
                    include: {
                        productInstances: {
                            include: {
                                product: true,
                            },
                        },
                    },
                });
            } else {
                saleTransactions = await prisma.saleTransaction.findMany({
                    include: {
                        productInstances: {
                            include: {
                                product: true,
                            },
                        },
                    },
                });
            }
            res.status(200).json(saleTransactions);
        } catch (err) {
            return res.status(500).json({ message: "[sale_transactions GET] Something went wrong" });
        }
    } else if (req.method === "POST") {
        const { newSaleTransaction }: { newSaleTransaction: CreateSaleTransactionWithProductInstances } = req.body;
        if (newSaleTransaction) {
            try {
                console.log("newSaleTransaction: ", newSaleTransaction);
                const newST = await prisma.saleTransaction.create({
                    data: {
                        status: newSaleTransaction.status,
                        dateTime: new Date().toISOString(),
                        customer: {
                            connect: {
                                id: newSaleTransaction.customerId,
                            },
                        },
                        salesPerson: {
                            connect: {
                                id: newSaleTransaction.salesPersonId,
                            },
                        },
                        source: {
                            connect: {
                                id: newSaleTransaction.sourceId,
                            },
                        },
                        locationLatitude: newSaleTransaction.locationLatitude,
                        locationLongitude: newSaleTransaction.locationLongitude,
                    },
                });
                res.status(201).json(newST);
            } catch (err) {
                return res.status(500).json({ message: "[sale_transactions POST] Something went wrong" });
            }
        }
    } else {
        res.setHeader("Allow", ["GET", "POST"]);
        res.status(405).json({ message: `HTTP method ${req.method} is not supported.` });
    }
}
