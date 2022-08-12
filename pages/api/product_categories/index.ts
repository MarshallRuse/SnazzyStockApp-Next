import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "lib/prisma";
import { productCategoryListToTree } from "lib/utils/productCategoryTrees";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Check if user is authenticated
    const session = await getSession({ req });
    if (!session) {
        return res.status(401).json({ message: "Unauthorized." });
    }

    if (req.method === "GET") {
        console.log("req.query", req.query);
        const categories = await prisma.productCategory.findMany();
        try {
            if (req.query.hierarchy === "true") {
                const categoryTree = productCategoryListToTree(categories);
                return res.status(200).json(categoryTree);
            } else {
                return res.status(200).json(categories);
            }
        } catch (err) {
            return res.status(500).json({ message: `[ProductCategory GET] ${err}` });
        }
    }

    // Create new ProductCategory
    if (req.method === "POST") {
        try {
        } catch (err) {
            console.log("ProductCategory Creation Error: ", err);
            return res.status(500).json({ message: `[ProductCategory POST] ${err}` });
        }
    } else {
        res.setHeader("Allow", ["GET", "POST"]);
        res.status(405).json({ message: `HTTP method ${req.method} is not supported.` });
    }
}
