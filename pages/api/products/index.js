import { getSession } from "next-auth/react";

export default async function handler(req, res) {
    // Check if user is authenticated
    const session = await getSession({ req });
    if (!session) {
        return res.status(401).json({ message: "Unauthorized." });
    }

    if (req.method === "GET") {
        try {
            const products = await prisma.product.findMany();
            res.status(200).json(products);
        } catch (err) {
            return res.status(500).json({ message: "[Products GET] Something went wrong" });
        }
    }

    // Create new product
    if (req.method === "POST") {
        try {
            const {
                sku,
                name,
                type,
                variationName,
                categoryId,
                category,
                description,
                parentId,
                parent,
                variations,
                image,
                length,
                lengthUnit,
                width,
                widthUnit,
                height,
                heightUnit,
                weight,
                weightUnit,
            } = req.body;

            const product = await prisma.home.create({
                data: {
                    sku,
                    name,
                    type,
                    variationName,
                    categoryId,
                    category,
                    description,
                    parentId,
                    parent,
                    variations,
                    image,
                    length,
                    lengthUnit,
                    width,
                    widthUnit,
                    height,
                    heightUnit,
                    weight,
                    weightUnit,
                },
            });

            res.status(201).json(product);
        } catch (err) {
            return res.status(500).json({ message: "[Products POST] Something went wrong" });
        }
    } else {
        res.setHeader("Allow", ["GET", "POST"]);
        res.status(405).json({ message: `HTTP method ${req.method} is not supported.` });
    }
}
