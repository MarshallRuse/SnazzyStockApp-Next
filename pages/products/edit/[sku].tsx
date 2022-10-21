import { unstable_getServerSession } from "next-auth/next";
import { authOptions } from "pages/api/auth/[...nextauth]";
import { prisma } from "lib/prisma";
import ProductForm, { defaultProductFormValues } from "components/forms/ProductForm";
import { GetServerSideProps } from "next";
import { Product, ProductCategory } from "@prisma/client";
import { IProductFormValues } from "lib/interfaces/IProductFormValues";

export const getServerSideProps: GetServerSideProps = async (context) => {
    const session = await unstable_getServerSession(context.req, context.res, authOptions);

    if (!session) {
        return {
            redirect: {
                destination: "/",
                permanent: false,
            },
        };
    }

    const { sku } = context.params;

    const product = await prisma.product.findUnique({
        where: {
            sku: sku as string,
        },
        include: {
            category: true,
            variations: true,
        },
    });

    if (!product) {
        return {
            notFound: true,
        };
    }

    const productCategories = await prisma.productCategory.findMany();

    return {
        props: {
            product: JSON.parse(JSON.stringify(product)),
            categories: JSON.parse(JSON.stringify(productCategories)),
        },
    };
};

type EditProductPageProps = {
    product: Product & { category: ProductCategory; variations: Product[] };
    categories: ProductCategory[];
};

const EditProductPage = ({ product, categories }: EditProductPageProps) => {
    const prodValues: IProductFormValues = { ...product, category: product.category.id };
    Object.keys(product).forEach((key) => {
        if (product[key] === null) {
            prodValues[key] = defaultProductFormValues[key];
        }
    });

    if (product.type === "VARIABLE") {
        prodValues.variations.forEach((variation) => {
            Object.keys(variation).forEach((key, ind) => {
                if (variation[key] === null) {
                    variation[key] = defaultProductFormValues.variations[0][key];
                }
            });
            variation.sku = variation.sku.includes("-") ? variation.sku.split("-")[1] : variation.sku;
        });
    }

    return (
        <div className='flex flex-col'>
            <h1>Edit Product</h1>
            <ProductForm initialValues={{ ...prodValues }} categories={categories} redirectOnSuccess />
        </div>
    );
};

export default EditProductPage;
