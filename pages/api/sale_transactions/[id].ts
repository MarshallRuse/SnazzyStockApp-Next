import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "lib/prisma";
import type { UpdateSaleTransactionWithProductInstances } from "lib/interfaces/UpdateSaleTransactionWithProductInstances";
import { SaleTransaction, ProductInstance } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Check if user is authenticated
    const session = await getSession({ req });
    if (!session) {
        return res.status(401).json({ message: "Unauthorized." });
    }

    let st: (SaleTransaction & { productInstances: ProductInstance[] }) | null = null;
    try {
        const { id } = req.query;
        st = await prisma.saleTransaction.findUnique({
            where: {
                id: id as string,
            },
            include: {
                productInstances: true,
            },
        });
        if (!st) {
            return res.status(404).json({ message: "Sale Transaction not found" });
        }
    } catch (err) {
        return res.status(500).json({ message: "[sale_transactions PATCH / DELETE] Something went wrong" });
    }

    if (req.method === "PATCH") {
        const { completedSaleTransaction }: { completedSaleTransaction: UpdateSaleTransactionWithProductInstances } =
            req.body;
        if (completedSaleTransaction) {
            try {
                const productInstanceUpdates = completedSaleTransaction.productInstances.map((inst) =>
                    prisma.productInstance.update({
                        where: {
                            id: inst.id,
                        },
                        data: {
                            saleTransaction: {
                                connect: {
                                    id: st.id,
                                },
                            },
                            discount: inst.discount,
                            discountType: inst.discountType,
                            finalSalePrice: inst.finalSalePrice,
                        },
                    })
                );

                const updatedSaleTransaction = await prisma.$transaction([
                    ...productInstanceUpdates,
                    prisma.saleTransaction.update({
                        where: {
                            id: st.id,
                        },
                        data: {
                            status: "COMPLETE",
                            dateTime: new Date().toISOString(),
                        },
                    }),
                ]);

                return res.status(204).end();
            } catch (err) {
                return res.status(500).json({ message: "[sale_transactions PATCH] Something went wrong" });
            }
        }
    } else if (req.method === "DELETE") {
        // Disconnect all ProductInstances from the sale transaction
        const productInstanceUpdates = st.productInstances.map((inst) =>
            prisma.productInstance.update({
                where: {
                    id: inst.id,
                },
                data: {
                    saleTransaction: {
                        disconnect: true,
                    },
                    discount: 0,
                    discountType: undefined,
                    finalSalePrice: undefined,
                },
            })
        );

        // With a prisma transaction, delete the sale transaction
        try {
            await prisma.$transaction([
                ...productInstanceUpdates,
                prisma.saleTransaction.delete({
                    where: {
                        id: st.id,
                    },
                }),
            ]);

            return res.status(204).end();
        } catch (err) {
            return res.status(500).json({ message: "[sale_transactions DELETE] Something went wrong" });
        }
    } else {
        res.setHeader("Allow", ["PATCH", "DELETE"]);
        res.status(405).json({ message: `HTTP method ${req.method} is not supported.` });
    }
}
