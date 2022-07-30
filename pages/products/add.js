import { unstable_getServerSession } from "next-auth/next";
import { authOptions } from "pages/api/auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/forms/ProductForm";

export async function getServerSideProps(context) {
    const session = await unstable_getServerSession(context.req, context.res, authOptions);
    console.log("add session: ", session);

    if (!session) {
        return {
            redirect: {
                destination: "/",
                permanent: false,
            },
        };
    }

    const categories = await prisma.productCategory.findMany();

    return {
        props: {
            categories: JSON.parse(JSON.stringify(categories)),
        },
    };
}

export default function AddProductPage({ categories = [] }) {
    console.log("categories in AddProductPage: ", categories);
    return (
        <div className='flex flex-col'>
            <h1>Add Product</h1>
            <ProductForm categories={categories} />
        </div>
    );
}
