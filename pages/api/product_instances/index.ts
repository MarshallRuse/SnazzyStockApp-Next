import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "lib/prisma";
import type { ProductInstanceWithSaleTransactionId } from "lib/interfaces/ProductInstanceWithSaleTransactionId";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Check if user is authenticated
    const session = await getSession({ req });
    if (!session) {
        return res.status(401).json({ message: "Unauthorized." });
    }

    if (req.method === "GET") {
        const productInstances = await prisma.productInstance.findMany();
        return res.status(200).json(productInstances);
    } else if (req.method === "PATCH") {
        const { instances }: { instances: ProductInstanceWithSaleTransactionId[] } = req.body;
        try {
            if (instances) {
                const updatedProductInstances = await prisma.productInstance.updateMany({
                    where: {
                        id: {
                            in: instances.map((inst) => inst.id),
                        },
                    },
                    data: {
                        saleTransactionId: instances[0].saleTransactionId, // all saleTransactionIds will be the same
                    },
                });
                return res.status(200).json(updatedProductInstances);
            } else {
                return res.status(400).json({ message: "'instances' key required" });
            }
        } catch (err) {
            return res.status(500).json({ message: "[Products GET] Something went wrong" });
        }
    } else {
        res.setHeader("Allow", ["GET", "POST", "PATCH"]);
        res.status(405).json({ message: `HTTP method ${req.method} is not supported.` });
    }
}
