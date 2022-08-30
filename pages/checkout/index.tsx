import { ReactNode, SyntheticEvent, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { unstable_getServerSession } from "next-auth/next";
import { authOptions } from "pages/api/auth/[...nextauth]";
import { prisma } from "lib/prisma";
import { IconButton, Tab, Tabs, Typography } from "@mui/material";
import Add from "@mui/icons-material/Add";
import CartContents from "components/CartContents";
import { CreateSaleTransactionWithProductInstances } from "lib/interfaces/CreateSaleTransactionWithProductInstances";
import CTAButton from "components/CTAButton";
import { ProductWithInstanceStockData } from "lib/interfaces/ProductWithInstanceStockData";
import ProductAutocomplete from "components/forms/inputs/ProductAutocomplete";
import {
    productCategorySubTree,
    productCategoryTreeToList,
    productCategoryListToTree,
} from "lib/utils/productCategoryTrees";
import CartProductCard from "components/CartProductCard";
import type { GetServerSideProps } from "next";
import type { SaleTransaction, ProductInstance, Product, User, Source } from "@prisma/client";
import type { ProductCategoryTree } from "lib/interfaces/IProductCategoryTree";

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

    const salesPerson = await prisma.user.findUnique({
        where: {
            email: session.user.email,
        },
    });

    const source = await prisma.source.findUnique({
        where: {
            type: "Market",
        },
    });

    const openSaleTransactions = await prisma.saleTransaction.findMany({
        where: {
            status: "OPEN",
        },
        include: {
            productInstances: {
                include: {
                    product: true,
                },
            },
        },
    });

    const categories = await prisma.productCategory.findMany({
        include: {
            _count: {
                select: {
                    products: true,
                },
            },
        },
    });
    const categoryTree = productCategoryListToTree(categories);
    const categoriesWithDescendentProductCount = categories.map((cat) => {
        const subTree = productCategorySubTree(categoryTree, "id", cat.id);
        const subCategories = productCategoryTreeToList(subTree).flat();
        return {
            ...cat,
            productCount: subCategories.reduce((acc, curr) => acc + curr._count.products, 0),
        };
    });

    const products = await prisma.product.findMany({
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

    return {
        props: {
            salesPerson: JSON.parse(JSON.stringify(salesPerson)),
            source: JSON.parse(JSON.stringify(source)),
            openSaleTransactions: JSON.parse(JSON.stringify(openSaleTransactions)),
            categories: JSON.parse(JSON.stringify(categoriesWithDescendentProductCount)),
            products: JSON.parse(JSON.stringify(products)),
            pagePadding: false,
        },
    };
};

type TabPanelProps = {
    children: ReactNode;
    value: number;
    index: number;
};

const TabPanel = ({ children, value, index, ...other }: TabPanelProps) => {
    return (
        <div
            className='overflow-y-auto rounded shadow-md flex flex-col flex-grow pb-4'
            role='tabpanel'
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <>{children}</>}
        </div>
    );
};

type CheckoutPageProps = {
    salesPerson: User;
    source: Source;
    openSaleTransactions: (SaleTransaction & { productInstances: (ProductInstance & { product: Product })[] })[];
    categories: ProductCategoryTree[];
    products: ProductWithInstanceStockData[];
};

const CheckoutPage = ({
    salesPerson,
    source,
    openSaleTransactions = [],
    categories = [],
    products = [],
}: CheckoutPageProps) => {
    const router = useRouter();

    const [tabValue, setTabValue] = useState(0);
    const [carts, setCarts] = useState<ProductWithInstanceStockData[][]>([]);
    const [displayedCategory, setDisplayedCategory] = useState<ProductCategoryTree>(
        categories.find((cat) => cat.name === "Jewellery")
    );
    const [productToAddToCart, setProductToAddToCart] = useState<ProductWithInstanceStockData | null>(null);

    const refreshSaleTransactions = () => {
        router.replace(router.asPath);
    };

    const getCoordinates = (): Promise<GeolocationPosition> => {
        return new Promise(function (resolve, reject) {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });
    };

    const handleProductSearchValueChange = (prod: ProductWithInstanceStockData) => {
        setProductToAddToCart(prod);
    };

    const handleTabChange = (event: SyntheticEvent, newValue: number) => setTabValue(newValue);
    const handleAddTabClick = async () => {
        console.log("click");
        // open a new sale transaction in the database
        let newSaleTransaction: CreateSaleTransactionWithProductInstances = {
            status: "OPEN",
            dateTime: undefined, // will be set from the backend
            customerId: "UnknownCustomer",
            salesPersonId: salesPerson.id,
            sourceId: source.id,
            locationLatitude: undefined,
            locationLongitude: undefined,
            productInstances: [],
        };
        if (navigator.geolocation) {
            try {
                const position = await getCoordinates();
                newSaleTransaction["locationLatitude"] = position.coords.latitude;
                newSaleTransaction["locationLongitude"] = position.coords.longitude;

                // If location data available, reverse geocode it to get city, province, country
                // if (position.coords.latitude && position.coords.longitude){
                //     const result = await fetch(`https://us1.locationiq.com/v1/reverse.php?key=YOUR_ACCESS_TOKEN&lat=LATITUDE&lon=LONGITUDE&format=json`)
                // }
            } catch (err) {
                console.log("Could not obtain geolocation");
            }
        }
        const newSTResult = await fetch("/api/sale_transactions", {
            method: "POST",
            mode: "cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newSaleTransaction }),
        });
        if (newSTResult.status === 201) {
            refreshSaleTransactions();
        } else {
            const newST = await newSTResult.json();
            console.log(newST.message);
        }
    };

    const removeCart = (cartIndex) => {
        // If last cart, set TabValue to previous Tab's value
        if (cartIndex === carts.length - 1) {
            cartIndex === 0 ? setTabValue(0) : setTabValue(cartIndex - 1);
        }
        let newCarts = [...carts];
        newCarts.splice(cartIndex, 1); // delete the cart from the list of carts
        setCarts(newCarts);
    };

    const handleCartProductCardClicked = (prod: ProductWithInstanceStockData) => {
        setProductToAddToCart(prod);
    };

    const handleAddEditCartDialogClosed = () => {
        setProductToAddToCart(null);
    };

    useEffect(() => {
        // Carts expect a list of (Product & { productInstances: ProductInstance[]}),
        // but openSaleTransactions has the list of productInstances.  Flip this.
        let groupedCartItems: ProductWithInstanceStockData[][] = openSaleTransactions.map((st) =>
            st.productInstances
                .map((inst, _, self) => ({
                    ...inst.product,
                    productInstances: self.filter((i) => i.productId === inst.product.id),
                }))
                // products will be duplicated when >1 related instance, so remove duplicates
                .filter((prod, ind, self) => self.findIndex((p) => p.sku === prod.sku) === ind)
        );
        setCarts(groupedCartItems);
        setTabValue(groupedCartItems.length - 1);
    }, [openSaleTransactions]);

    return (
        <>
            {carts.length === 0 && (
                <div className='grid grid-cols-12 justify-center h-full'>
                    <div className='col-span-12 flex justify-center items-center h-48'>
                        <Typography variant='body1' color='textSecondary' component='p' align='center'>
                            No Sale Transactions open
                        </Typography>
                    </div>
                    <div className='col-span-12 flex justify-center p-8'>
                        <CTAButton onClick={handleAddTabClick}>Start Transaction</CTAButton>
                    </div>
                    <div className='col-span-12'>
                        <Typography variant='body1' color='textPrimary' component='p' align='center'>
                            See today's sales
                        </Typography>
                    </div>
                </div>
            )}
            {carts.length > 0 && (
                <div className='w-full h-screen relative overflow-y-auto subtleScrollbar'>
                    <div className='absolute top-0 bottom-0 left-0 right-0'>
                        <div className='max-h-screen grid grid-cols-12 h-full gap-4 pl-4'>
                            <div className='max-h-screen col-span-8 grid grid-cols-12 grid-rows-5 overflow-auto'>
                                <div className='col-span-12 row-span-1 px-2 flex justify-between items-center'>
                                    <h1 className='m-0'>Product Catalogue</h1>
                                    <div className='w-64'>
                                        <ProductAutocomplete
                                            type='input'
                                            productsProvided={true}
                                            providedProducts={products}
                                            onValueChange={handleProductSearchValueChange}
                                        />
                                    </div>
                                </div>
                                <div className='col-span-12 row-span-1 p-2 flex items-center gap-4 overflow-x-auto noScrollbar'>
                                    {categories.map((cat) => (
                                        <div
                                            key={cat.name}
                                            className={`flex items-center p-2 gap-2 ${
                                                cat.id === displayedCategory.id ? "bg-bluegreen-500" : "bg-white"
                                            } border border-bluegreen-500 min-w-[125px] max-w-max h-16 rounded-md cursor-pointer transition hover:-translate-y-1 hover:bg-bluegreen-500 hover:border-bluegreen-500 group`}
                                            onClick={() => setDisplayedCategory(cat)}
                                        >
                                            <div
                                                className={`flex flex-col justify-between ${
                                                    cat.id === displayedCategory.id
                                                        ? "text-white"
                                                        : "text-bluegreen-500"
                                                } text-sm gap-2 group-hover:text-white`}
                                            >
                                                <span>{cat.name}</span>
                                                <span className='text-xs whitespace-nowrap'>{`${cat.productCount} items`}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className='col-span-12 row-span-3 p-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 justify-center gap-x-6 gap-y-9 overflow-auto subtleScrollbar'>
                                    {products
                                        .filter((prod) => {
                                            const subTree = productCategorySubTree(
                                                [displayedCategory],
                                                "id",
                                                displayedCategory.id
                                            );
                                            const subCategories = productCategoryTreeToList(subTree).flat();
                                            return subCategories.some((cat) => cat.id === prod.categoryId);
                                        })
                                        .map((prod) => (
                                            <CartProductCard
                                                key={prod.id}
                                                product={prod}
                                                category={categories.find((cat) => cat.id === prod.categoryId)}
                                                onCartItemClicked={handleCartProductCardClicked}
                                            />
                                        ))}
                                </div>
                            </div>
                            <div className='max-h-screen overflow-y-auto col-span-4 min-w-[320px] h-full flex flex-col border-l border-zinc-100'>
                                <Tabs
                                    value={tabValue}
                                    onChange={handleTabChange}
                                    aria-label='cart tabs'
                                    className='max-h-12'
                                    variant='scrollable'
                                    scrollButtons='auto'
                                    // allowScrollButtonsMobile // MUI v5
                                >
                                    {carts.map((cart, ind) => (
                                        <Tab
                                            key={`Cart${ind + 1}`}
                                            label={`Cart #${ind + 1}`}
                                            value={ind}
                                            className='border border-zinc-100 font-semibold rounded-tl-sm rounded-tr-sm'
                                        />
                                    ))}
                                    <div className='self-center'>
                                        <IconButton size='small' onClick={handleAddTabClick}>
                                            <Add />
                                        </IconButton>
                                    </div>
                                </Tabs>
                                <TabPanel value={tabValue} index={tabValue}>
                                    <CartContents
                                        saleTransactionId={openSaleTransactions[tabValue].id}
                                        cartIndex={tabValue}
                                        removeCart={removeCart}
                                        contents={carts[tabValue]}
                                        products={products}
                                        productToBeAdded={productToAddToCart}
                                        flagDialogClosed={handleAddEditCartDialogClosed}
                                        refreshSaleTransactions={refreshSaleTransactions}
                                        fullHeightTable={true}
                                        actionButtons={true}
                                    />
                                </TabPanel>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CheckoutPage;
