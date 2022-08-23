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

    if (req.method === "GET") {
        let products: Product[] | null = null;
        try {
            const { instanceCount } = req.query;
            if (instanceCount) {
                products = await prisma.product.findMany({
                    where: {
                        type: {
                            in: ["SIMPLE", "VARIATION"],
                        },
                    },
                    include: {
                        productInstances: {
                            select: {
                                id: true,
                                saleTransactionId: true,
                            },
                        },
                    },
                });
            } else {
                products = await prisma.product.findMany();
            }

            res.status(200).json(products);
        } catch (err) {
            return res.status(500).json({ message: "[Products GET] Something went wrong" });
        }
    }

    // Create new product
    if (req.method === "POST") {
        try {
            const { products, categoryId } = req.body;
            console.log("products: ", products);
            console.log("categoryId: ", categoryId);
            if (products.length === 1 && products?.[0]?.type === "SIMPLE") {
                const product = await prisma.product.create({
                    data: {
                        ...products[0],
                        category: {
                            connect: {
                                id: categoryId,
                            },
                        },
                    },
                });
                console.log("product: ", product);
                res.status(201).json(product);
            } else if (
                products.filter((prod: Prisma.ProductCreateWithoutCategoryInput) => prod.type === "VARIABLE").length ===
                    1 &&
                products.filter((prod: Prisma.ProductCreateWithoutCategoryInput) => prod.type === "VARIABLE")[0] // should only be 1 VARIABLE product with VARIATION children
            ) {
                const productVariations = await prisma.product.create({
                    data: {
                        ...products[0],
                        category: {
                            connect: {
                                id: categoryId,
                            },
                        },
                        variations: {
                            create: products
                                .filter((prod: Prisma.ProductCreateInput) => prod.type === "VARIATION")
                                .map((prod: Prisma.ProductCreateInput) => ({
                                    ...prod,
                                    category: {
                                        connect: {
                                            id: categoryId,
                                        },
                                    },
                                })),
                        },
                    },
                    include: {
                        variations: true,
                    },
                });
                res.status(201).json(productVariations);
            }
        } catch (err) {
            console.log("Product Creation Error: ", err);
            return res.status(500).json({ message: `[Products POST] ${err}` });
        }
    } else {
        res.setHeader("Allow", ["GET", "POST"]);
        res.status(405).json({ message: `HTTP method ${req.method} is not supported.` });
    }
}
