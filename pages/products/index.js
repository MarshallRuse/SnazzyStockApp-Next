import { prisma } from "@/lib/prisma";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormControlLabel, Switch, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CTAButton from "@/components/CTAButton";
import ProductCard from "@/components/ProductCard";
import SearchBar from "@/components/SearchBar";

export async function getServerSideProps(context) {
    const { query } = context;
    let category = {};
    if ("category" in query) {
        category = await prisma.productcategory.findUnique({
            where: {
                name: query.category,
            },
        });
    }

    // get all products (by category or not)
    const products = category.id
        ? await prisma.product.findMany({
              where: {
                  category: category.id,
              },
          })
        : await prisma.product.findMany();

    return {
        props: {
            products: JSON.parse(JSON.stringify(products)),
            category: JSON.parse(JSON.stringify(category)),
        },
    };
}

export default function ProductsListPage({ products = [], category = {} }) {
    const { query } = useRouter();

    const [productGroups, setProductGroups] = useState([]);
    const [searchValue, setSearchValue] = useState("");
    const [compactMode, setCompactMode] = useState(false);

    const handleSearch = (searchString) => {
        setSearchValue(searchString);
    };

    const handleCompactModeChange = () => setCompactMode(!compactMode);

    const groupProducts = (products) => {
        // Create a list of simple and Variable products
        const simpleAndVariableProducts = products.filter((prod) => prod.type === "SIMPLE" || prod.type === "VARIABLE");
        console.log("Simple and Variable Products: ", simpleAndVariableProducts);

        const productGroups = simpleAndVariableProducts.map((product) => ({
            GroupSKU: product.sku,
            GroupType: product.type,
            GroupName: product.name,
            GroupImage: product.image,
            variations: products.filter((prod) => prod.type === "VARIATION" && prod.parentId === product.id),
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
                        <CTAButton heavyRounding={false}>
                            <AddIcon />
                            Add Product
                        </CTAButton>
                    </Link>
                </div>
            </div>
            {productGroups.length > 0 ? (
                productGroups
                    .filter((group) => {
                        if (!searchValue) {
                            return true;
                        }
                        const searchStringInGroup = group.GroupSKU.toLowerCase().includes(searchString.toLowerCase());
                        const searchStringInChildrenNames =
                            group.variations.filter((prod) =>
                                prod.name.toLowerCase().includes(searchString.toLowerCase())
                            ).length > 0;
                        return searchStringInGroup || searchStringInChildrenNames;
                    })
                    .map((prodGroup) => (
                        <ProductCard
                            key={prodGroup.GroupSKU}
                            name={prodGroup.GroupName}
                            id={prodGroup.GroupSKU}
                            imageSrc={prodGroup.GroupImage}
                            variations={prodGroup.variations}
                        />
                    ))
            ) : (
                <div className='col-span-12'>
                    <Typography align='center' style={{ marginTop: "50px" }}>
                        No Products in <strong>{query.category}</strong> category
                    </Typography>
                </div>
            )}
        </div>
    );
}
