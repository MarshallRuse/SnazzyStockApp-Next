import { ReactNode, SyntheticEvent, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { unstable_getServerSession } from "next-auth/next";
import { authOptions } from "pages/api/auth/[...nextauth]";
import { prisma } from "lib/prisma";
import { Prisma, SaleTransaction, ProductInstance, Product, User, Source } from "@prisma/client";
import { Button, IconButton, Tab, Tabs, Typography } from "@mui/material";
import Add from "@mui/icons-material/Add";
import CartContents from "components/CartContents";
import groupCartItems from "lib/utils/groupCartItems";
import type { GetServerSideProps } from "next";
import type { IGroupedCartItem } from "lib/interfaces/IGroupedCartItem";
import { CreateSaleTransactionWithProductInstances } from "lib/interfaces/CreateSaleTransactionWithProductInstances";
import CTAButton from "components/CTAButton";
import { ProductWithInstanceStockData } from "lib/interfaces/ProductWithInstanceStockData";

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
            products: JSON.parse(JSON.stringify(products)),
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
            className='rounded shadow-md md:h-full'
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
    products: ProductWithInstanceStockData[];
};

const CheckoutPage = ({ salesPerson, source, openSaleTransactions = [], products = [] }: CheckoutPageProps) => {
    const router = useRouter();

    const [tabValue, setTabValue] = useState(0);
    const [carts, setCarts] = useState<IGroupedCartItem[][]>([]);

    const refreshSaleTransactions = () => {
        router.replace(router.asPath);
    };

    const getCoordinates = (): Promise<GeolocationPosition> => {
        return new Promise(function (resolve, reject) {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });
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

    useEffect(() => {
        let groupedCartItems = openSaleTransactions.map((st) => groupCartItems(st.productInstances));
        setCarts(groupedCartItems);
        setTabValue(groupedCartItems.length - 1);
    }, [openSaleTransactions]);

    return (
        <>
            {carts.length === 0 && (
                <div className='grid grid-cols-12 justify-center'>
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
                <div className='p-5 pb-0 h-[82vh] max-h-[82vh] md:min-h-[85vh] w-full overflow-y-auto'>
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

                        <IconButton onClick={handleAddTabClick}>
                            <Add />
                        </IconButton>
                    </Tabs>
                    <TabPanel value={tabValue} index={tabValue}>
                        <CartContents
                            salesPersonId={salesPerson.id}
                            sourceId={source.id}
                            saleTransactionId={openSaleTransactions[tabValue].id}
                            cartIndex={tabValue}
                            removeCart={removeCart}
                            contents={carts[tabValue]}
                            products={products}
                            refreshSaleTransactions={refreshSaleTransactions}
                            fullHeightTable={true}
                            actionButtons={true}
                        />
                    </TabPanel>
                </div>
            )}
        </>
    );
};

export default CheckoutPage;
