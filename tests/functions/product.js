import { prisma } from "@/lib/prisma";

export async function createProduct(product) {
    return await prisma.product.create({
        data: product,
    });
}

export async function updateProduct(product) {
    return await prisma.product.update({
        where: { id: product.id },
        data: product,
    });
}
