import { Product, ProductCategory } from "@prisma/client";
import { prisma } from "lib/prisma";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormControlLabel, Switch, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CTAAnchor from "components/CTAAnchor";
import ProductCard from "components/ProductCard";
import SearchBar from "components/SearchBar";
import { GetServerSideProps } from "next";
import { IProductGroup } from "lib/interfaces/IProductGroup";
import { nameToSlug, slugToName } from "lib/utils/slugUtils";
import {
    productCategoryListToTree,
    productCategoryTreeToList,
    productCategorySubTree,
} from "lib/utils/productCategoryTrees";

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { query } = context;
    let category = null;
    let subCategories = null;

    if ("category" in query) {
        if (typeof query.category === "string") {
            const categories = await prisma.productCategory.findMany();
            category = categories.find((cat) => nameToSlug(cat.name) === (query.category as string).toLowerCase());
            const categoryTree = productCategoryListToTree(categories);
            const subTree = productCategorySubTree(categoryTree, "name", category.name);
            subCategories = productCategoryTreeToList(subTree).flat();
        }
    }

    // get all products (by category or not)
    const products = category?.id
        ? await prisma.product.findMany({
              where: {
                  categoryId: {
                      in: [category.id, ...subCategories?.map((cat) => cat.id)],
                  },
              },
              include: {
                  parent: true,
              },
          })
        : await prisma.product.findMany();

    return {
        props: {
            products: JSON.parse(JSON.stringify(products)),
            category: JSON.parse(JSON.stringify(category)),
        },
    };
};

type ProductWithParent = Product & { parent: Product };

export default function ProductsListPage({
    products = [],
    category = null,
}: {
    products: (Product & { parent: Product })[];
    category: ProductCategory;
}) {
    const { query } = useRouter();

    const [productGroups, setProductGroups] = useState<IProductGroup[]>([]);
    const [searchValue, setSearchValue] = useState("");
    const [compactMode, setCompactMode] = useState(false);

    const handleSearch = (searchString: string) => {
        setSearchValue(searchString);
    };

    const handleCompactModeChange = () => setCompactMode(!compactMode);

    const groupProducts = (products: ProductWithParent[]): IProductGroup[] => {
        // Create a list of simple and Variable products
        const simpleAndVariableProducts: ProductWithParent[] = products.filter(
            (prod) => prod.type === "SIMPLE" || prod.type === "VARIABLE"
        );

        const variationProducts: ProductWithParent[] = products.filter((prod) => prod.type === "VARIATION");

        const productGroups: IProductGroup[] = simpleAndVariableProducts.map((product: Product) => ({
            groupSKU: product.sku,
            groupType: product.type,
            groupName: product.name,
            groupImage: product.image,
            variations: variationProducts.filter((prod) => prod.parent?.id === product.id),
        }));

        return productGroups;
    };

    useEffect(() => {
        setProductGroups(groupProducts(products));
    }, [products]);

    return (
        <div className='flex flex-col gap-12 m-0 w-full'>
            {"category" in query ? (
                <h1>
                    <span className='font-medium'>Products - </span>
                    {query.category}
                </h1>
            ) : (
                <h1>Products</h1>
            )}
            <div className='grid grid-cols-12 gap-12'>
                <div className='col-span-4'>
                    <FormControlLabel
                        control={<Switch checked={compactMode} onChange={handleCompactModeChange} name='compactMode' />}
                        label='Compact Mode'
                    />
                </div>
                <div className='col-span-8 sm:col-span-5'>
                    <SearchBar searchLabel='Search Products' searchVal={searchValue} searchControl={handleSearch} />
                </div>
                <div className='col-span-12 sm:col-span-3'>
                    <Link href='/products/add' passHref>
                        <CTAAnchor heavyRounding={false}>
                            <AddIcon />
                            Add Product
                        </CTAAnchor>
                    </Link>
                </div>
            </div>
            <div className='grid grid-cols-12 gap-4'>
                {productGroups.length > 0 ? (
                    productGroups
                        .filter((group: IProductGroup) => {
                            if (!searchValue) {
                                return true;
                            }
                            const searchStringInGroup = group.groupSKU
                                .toLowerCase()
                                .includes(searchValue.toLowerCase());
                            const searchStringInChildrenNames =
                                group.variations.filter((prod) =>
                                    prod.name.toLowerCase().includes(searchValue.toLowerCase())
                                ).length > 0;
                            return searchStringInGroup || searchStringInChildrenNames;
                        })
                        .map((group: IProductGroup) => (
                            <div className='col-span-12 sm:col-span-6 md:col-span-4' key={group.groupSKU}>
                                <ProductCard
                                    name={group.groupName}
                                    id={group.groupSKU}
                                    imageSrc={group.groupImage}
                                    variations={group.variations}
                                />
                            </div>
                        ))
                ) : (
                    <div className='col-span-12'>
                        <Typography align='center' style={{ marginTop: "50px" }}>
                            No Products in <strong>{query.category}</strong> category
                        </Typography>
                    </div>
                )}
            </div>
        </div>
    );
}
