import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { Prisma, Product } from "@prisma/client";
import { prisma } from "lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Check if user is authenticated
    const session = await getSession({ req });
    if (!session) {
        return res.status(401).json({ message: "Unauthorized." });
    }

    const { sku } = req.query;

    // Create new product
    if (req.method === "PATCH") {
        console.log("product PATCH req.body", req.body);
        try {
            const { products, categoryId }: { products: Prisma.ProductUpdateInput[]; categoryId: string } = req.body;
            const productUpdates = products
                .filter((prod) => Object.keys(prod).filter((key) => key !== "id").length > 0)
                .map((prod) => {
                    return prisma.product.update({
                        where: {
                            id: prod.id as string,
                        },
                        data: {
                            ...prod,
                            category: {
                                connect: {
                                    id: categoryId,
                                },
                            },
                        },
                    });
                });
            await prisma.$transaction(productUpdates);
            return res.status(204).end();
        } catch (err) {
            console.log("Product Update Error: ", err);
            return res.status(500).json({ message: `[Products PATCH] ${err}` });
        }
    } else {
        res.setHeader("Allow", ["PATCH", "DELETE"]);
        res.status(405).json({ message: `HTTP method ${req.method} is not supported.` });
    }
}
