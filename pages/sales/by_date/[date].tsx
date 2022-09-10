import { ReactNode, useState } from "react";
import { unstable_getServerSession } from "next-auth/next";
import { authOptions } from "pages/api/auth/[...nextauth]";
import { prisma } from "lib/prisma";
import { AppBar, Box, Tab, Tabs, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
    getSaleTransactionsSummaryByDate,
    salesTransactionDetailsToProductInstances,
} from "lib/utils/saleTransactionTransformations";
import ItemsSoldTable from "components/tables/ItemsSoldTable";
import ProductCategoriesChart from "components/charts/ProductCategoriesChart";
import SalesTimeLineChart from "components/charts/SalesTimeLineChart";
import UnitsSoldChart from "components/charts/UnitsSoldChart";
//import { calculateStartEndDates } from "../utils/timing";
import { CHART_COLORS } from "lib/utils/colors";

import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import type { GetServerSideProps } from "next";
import type { SaleTransactionsSummaryByDate } from "lib/interfaces/SaleTransactionsSummaryByDate";
import type { ProductInstanceWithProductData } from "lib/interfaces/ProductInstanceWithProductData";
import type { SaleTransactionDetails } from "lib/interfaces/SaleTransactionDetails";
import { ItemsSoldTableRow } from "lib/interfaces/ItemsSoldTableData";

dayjs.extend(isBetween);

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

    const { date } = context.params;
    if (date) {
        const saleTransactions: SaleTransactionDetails[] = await prisma.saleTransaction.findMany({
            where: {
                status: "COMPLETE",
                dateTime: {
                    lte: dayjs(date as string, "YYYY-MM-DD")
                        .add(1, "day")
                        .toISOString(),
                    gte: dayjs(date as string, "YYYY-MM-DD")
                        .subtract(1, "day")
                        .toISOString(),
                },
            },
            include: {
                source: true,
                productInstances: {
                    include: {
                        product: {
                            include: {
                                category: true,
                            },
                        },
                        purchaseOrder: true,
                    },
                },
            },
        });

        return {
            props: {
                date: JSON.parse(JSON.stringify(dayjs(date as string, "YYYY-MM-DD"))),
                saleDateData: JSON.parse(JSON.stringify(saleTransactions)),
            },
        };
    } else {
        return {
            redirect: {
                destination: "/sales",
                permanent: false,
            },
        };
    }
};

const StyledTab = styled(Tab)({
    root: {
        fontWeight: 700,
        minWidth: "260px",
    },
});

type TabPanelProps = {
    children: ReactNode;
    value: number;
    index: number;
};

const TabPanel = ({ children, value, index, ...rest }: TabPanelProps) => (
    <div
        role='tabpanel'
        hidden={value !== index}
        id={`scrollable-auto-tabpanel-${index}`}
        aria-labelledby={`scrollable-auto-tab-${index}`}
        {...rest}
    >
        {value === index && (
            <Box p={3}>
                <Typography>{children}</Typography>
            </Box>
        )}
    </div>
);

function a11yProps(index: number) {
    return {
        id: `scrollable-auto-tab-${index}`,
        "aria-controls": `scrollable-auto-tabpanel-${index}`,
    };
}

type DataTextProps = {
    children: ReactNode;
    className?: string;
    emphasized?: boolean;
    profitOrLoss?: "profit" | "loss";
};

const DataText = ({ children, className, emphasized = false, profitOrLoss }: DataTextProps) => (
    <span
        className={`text-base text-center whitespace-nowrap m-0 ${
            emphasized ? "text-blueyonder-500  text-2xl ml-2 align-baseline" : ""
        } ${profitOrLoss ? (profitOrLoss === "profit" ? "text-green-600" : "text-red-600") : ""}
        ${className}`}
    >
        {children}
    </span>
);

type SalesRecordsByDatePageProps = {
    date: dayjs.Dayjs;
    saleDateData: SaleTransactionDetails[];
};

const SalesRecordsByDatePage = ({ date, saleDateData = [] }: SalesRecordsByDatePageProps) => {
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event, newValue) => setTabValue(newValue);

    const saleDateSummary = getSaleTransactionsSummaryByDate(saleDateData)[0];

    // Organize data for ITEMS SOLD tab
    const transactionNumbers = saleDateData.map((std, ind) => ({ id: std.id, number: ind + 1 }));
    const formattedSales: ItemsSoldTableRow[] = saleDateData
        .map((std) =>
            std.productInstances
                .filter((inst, ind, self) => self.findIndex((x) => x.product.id === inst.product.id) === ind)
                .map((inst) => {
                    const unitsSold = std.productInstances.filter((x) => x.product.id === inst.product.id).length;
                    const cost = unitsSold * inst.invoiceCostCAD;
                    const revenue = std.productInstances
                        .filter((x) => x.product.id === inst.product.id)
                        .reduce((acc, curr) => acc + curr.finalSalePrice, 0);

                    return {
                        saleTransactionId: std.id,
                        transactionNumber: transactionNumbers.find((tn) => tn.id === std.id)?.number,
                        time: dayjs(std.dateTime).format("hh:mm A"),
                        sku: inst.product.sku,
                        productName: `${inst.product.name}${
                            inst.product.type === "VARIATION" && inst.product.variationName
                                ? ` - ${inst.product.variationName}`
                                : ""
                        }`,
                        unitsSold,
                        cost,
                        revenue,
                        grossMargin: revenue - cost,
                        source: std.source.type,
                    };
                })
        )
        .flat();

    //Organize data for PRODUCT CATEGORIES tab
    const prodCats = saleDateData
        .map((s) => [...s.productInstances])
        .flat()
        .map((inst) => inst.product.category)
        .filter((cat, ind, self) => self.findIndex((val) => val.id === cat.id) === ind);
    const productCategoriesChartData = prodCats.map((cat, ind) => {
        return {
            category: cat.name,
            items: saleDateData
                .map((s) => [...s.productInstances])
                .flat()
                .filter((inst) => inst.product.category.id === cat.id),
            color: CHART_COLORS[ind],
        };
    });

    // Oganize data for the SALES BY TIME OF DAY tab
    const productInstances = salesTransactionDetailsToProductInstances(saleDateData);

    return (
        <div className='grid grid-cols-12 gap-x-8 gap-y-6 w-full m-0 pb-8'>
            <div className='col-span-6 mb-6'>
                <h1 className='text-zinc-500 text-2xl font-light my-4'>Sales Record - By Date</h1>
                <h2 className='text-blueyonder-500 text-5xl font-normal m-0'>{dayjs(date).format("MMMM DD, YYYY")}</h2>
            </div>
            <div className='col-span-6 align-bottom flex flex-col justify-end mt-0 mb-6 pt-0'>
                <p className='text-zinc-500 m-0 flex items-baseline align-baseline'>
                    <span className='align-bottom'>Location</span>
                    <DataText emphasized>
                        {saleDateSummary?.location !== null && saleDateSummary?.location !== ""
                            ? saleDateSummary?.location
                            : "Not Recorded"}
                    </DataText>
                </p>
            </div>
            <div className='col-span-4 text-3xl my-6 leading-normal p-4 rounded-md shadow-lightest-around'>
                <strong className='text-blueyonder-500 font-bold'>{saleDateSummary?.unitsSold}</strong> units sold
                <br />
                <span className='text-zinc-400'>in </span>
                <strong className='text-blueyonder-500 font-bold'>{saleDateSummary?.numTransactions}</strong>{" "}
                transaction{saleDateSummary?.numTransactions > 1 && "s"}
                <br />
                <span className='text-zinc-400'>across </span>
                <strong className='text-blueyonder-500 font-bold'>{saleDateSummary?.numSources}</strong> sales channel
                {saleDateSummary?.numSources > 1 && "s"}
            </div>
            <div className='col-span-4 text-3xl my-6 leading-normal p-4 rounded-md shadow-lightest-around'>
                <strong className='text-blueyonder-500 font-bold'>
                    {new Intl.NumberFormat("en-CA", {
                        style: "currency",
                        currency: "CAD",
                    }).format(saleDateSummary?.revenue)}
                </strong>{" "}
                revenue
                <span className='text-zinc-400'>
                    {" "}
                    for
                    <br />
                    goods that{" "}
                </span>
                cost{" "}
                <strong className='text-blueyonder-500 font-bold'>
                    {new Intl.NumberFormat("en-CA", {
                        style: "currency",
                        currency: "CAD",
                    }).format(saleDateSummary?.costOfGoodsSold)}
                </strong>
                <br />
                <span className='text-zinc-400'>for</span>{" "}
                <strong className={`${saleDateSummary?.grossMargin > 0 ? "text-green-600" : "text-red-600"} font-bold`}>
                    {new Intl.NumberFormat("en-CA", {
                        style: "currency",
                        currency: "CAD",
                    }).format(saleDateSummary?.grossMargin)}
                </strong>{" "}
                profit
            </div>
            {/* <div className='col-span-12 bg-zinc-50 rounded-md p-6'>
                <div className='grid grid-cols-12'>
                    <div className='col-span-12'>
                        <h3 className='font-normal mt-0 text-4xl text-blueyonder-500'>Summary</h3>
                    </div>
                    <div className='col-span-6 sm:col-span-4 flex flex-nowrap my-4'>
                        <DataText>
                            <p className='text-zinc-500'>
                                Number of Transactions{" "}
                                <DataText emphasized>
                                    <strong>{saleDateSummary.numTransactions}</strong>
                                </DataText>
                            </p>
                        </DataText>
                    </div>
                    <div className='col-span-6 sm:col-span-4 flex flex-nowrap my-4'>
                        <DataText>
                            <p className={`text-zinc-500`}>
                                Units Sold{" "}
                                <DataText emphasized>
                                    <strong>{saleDateSummary.unitsSold}</strong>
                                </DataText>
                            </p>
                        </DataText>
                    </div>
                    <div className='col-span-6 sm:col-span-4 flex flex-nowrap my-4'>
                        <DataText>
                            <p className={`text-zinc-500`}>
                                Revenue{" "}
                                <DataText emphasized>
                                    <strong>
                                        {new Intl.NumberFormat("en-CA", {
                                            style: "currency",
                                            currency: "CAD",
                                        }).format(saleDateSummary.revenue)}
                                    </strong>
                                </DataText>
                            </p>
                        </DataText>
                    </div>
                    <div className='col-span-6 sm:col-span-4 flex flex-nowrap my-4'>
                        <DataText>
                            <p className={`text-zinc-500`}>
                                Cost of Goods Sold{" "}
                                <DataText emphasized>
                                    <strong>
                                        {new Intl.NumberFormat("en-CA", {
                                            style: "currency",
                                            currency: "CAD",
                                        }).format(saleDateSummary.costOfGoodsSold)}
                                    </strong>
                                </DataText>
                            </p>
                        </DataText>
                    </div>
                    <div className='col-span-6 sm:col-span-4 flex flex-nowrap my-4'>
                        <DataText>
                            <p className={`text-zinc-500`}>
                                Gross Margin{" "}
                                <DataText emphasized profitOrLoss={saleDateSummary.grossMargin > 0 ? "profit" : "loss"}>
                                    <strong>
                                        {new Intl.NumberFormat("en-CA", {
                                            style: "currency",
                                            currency: "CAD",
                                        }).format(saleDateSummary.grossMargin)}
                                    </strong>
                                </DataText>
                            </p>
                        </DataText>
                    </div>
                </div>
            </div> */}
            <div className='col-span-12'>
                <div className='w-full flex-grow'>
                    <AppBar position='static' color='transparent' elevation={0}>
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            indicatorColor='primary'
                            textColor='primary'
                            variant='scrollable'
                            scrollButtons='auto'
                            aria-label='summary tabs'
                            //TabIndicatorProps={{ style: { width: "260px" } }}
                        >
                            <StyledTab label='Items Sold' {...a11yProps(0)} />
                            <StyledTab label='Item Categories' {...a11yProps(1)} />
                            <StyledTab label='Sales by Time of Day' {...a11yProps(2)} />
                            <StyledTab label='Number of Units Sold' {...a11yProps(3)} />
                        </Tabs>
                    </AppBar>
                    <TabPanel value={tabValue} index={0}>
                        {formattedSales.length > 0 ? (
                            <div className='col-span-12 mx-6'>
                                <ItemsSoldTable itemsSold={formattedSales} />
                            </div>
                        ) : (
                            <p>No sales found for {dayjs(date).format("MMMM DD, YYYY")}</p>
                        )}
                    </TabPanel>
                    <TabPanel value={tabValue} index={1}>
                        <div className='col-span-12'>
                            {saleDateSummary.numTransactions > 0 ? (
                                <ProductCategoriesChart productCategoriesData={productCategoriesChartData} />
                            ) : (
                                <p>No sales found for {dayjs(date).format("MMMM DD, YYYY")}</p>
                            )}
                        </div>
                    </TabPanel>
                    <TabPanel value={tabValue} index={2}>
                        {productInstances.length > 0 ? (
                            <SalesTimeLineChart
                                period='Custom'
                                customPeriod={{
                                    startDate: dayjs(date).format("YYYY-MM-DD"),
                                    endDate: dayjs(date).format("YYYY-MM-DD"),
                                }}
                                productInstances={productInstances}
                            />
                        ) : (
                            <p>No sales found for {dayjs(date).format("MMMM DD, YYYY")}</p>
                        )}
                    </TabPanel>
                    <TabPanel value={tabValue} index={3}>
                        {productInstances.length > 0 ? (
                            <UnitsSoldChart
                                period='Custom'
                                customPeriod={{
                                    startDate: dayjs(date).format("YYYY-MM-DD"),
                                    endDate: dayjs(date).format("YYYY-MM-DD"),
                                }}
                                productInstances={productInstances}
                            />
                        ) : (
                            <p>No sales found for {dayjs(date).format("MMMM DD, YYYY")}</p>
                        )}
                    </TabPanel>
                </div>
            </div>
        </div>
    );
};

export default SalesRecordsByDatePage;
