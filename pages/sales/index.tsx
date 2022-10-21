import { useEffect, useState } from "react";
import type { ChangeEvent, SyntheticEvent } from "react";
import Link from "next/link";
import { unstable_getServerSession } from "next-auth/next";
import { authOptions } from "pages/api/auth/[...nextauth]";
import { prisma } from "lib/prisma";
import { Add as AddIcon } from "@mui/icons-material";
import TimePeriodSelect from "components/TimePeriodFilter";
import SalesRecordsTable from "components/tables/SalesRecordsTable";
import CTAButton from "components/CTAButton";
import type { GetServerSideProps } from "next";
import {
    getSaleTransactionsSummaryByDate,
    salesTransactionDetailsToProductInstances,
} from "lib/utils/saleTransactionTransformations";
import SalesTimeLineChart from "components/charts/SalesTimeLineChart";
import { SaleTransactionDetails } from "lib/interfaces/SaleTransactionDetails";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { ProductInstanceWithPurchaseAndSaleData } from "lib/interfaces/ProductInstanceWithPurchaseAndSaleData";
import { periods } from "lib/interfaces/Periods";
import { getStartAndEndDates } from "lib/utils/timing";
import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Tab, Tabs } from "@mui/material";
import TabPanel from "components/TabPanel";
import UnitsSoldChart from "components/charts/UnitsSoldChart";
import Counter from "components/Counter";

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

    const saleTransactions: SaleTransactionDetails[] = await prisma.saleTransaction.findMany({
        where: {
            status: "COMPLETE",
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
        orderBy: {
            dateTime: "asc",
        },
    });

    return {
        props: {
            salesData: JSON.parse(JSON.stringify(saleTransactions)),
        },
    };
};

type SalesPageProps = {
    salesData: SaleTransactionDetails[];
};

const SalesPage = ({ salesData }: SalesPageProps) => {
    const [period, setPeriod] = useState<typeof periods[number]>("This Month");
    const [startAndEndDate, setStartAndEndDate] = useState<{ startDate: string; endDate: string }>(
        getStartAndEndDates(
            period,
            salesData[0].dateTime.toString(),
            salesData[salesData.length - 1].dateTime.toString()
        )
    );
    const [tabValue, setTabValue] = useState(0);
    const [byDateChartDisplayed, setByDateChartDisplayed] = useState<"value" | "units">("value");

    const productInstances: ProductInstanceWithPurchaseAndSaleData[] =
        salesTransactionDetailsToProductInstances(salesData);

    const onPeriodChange = (period: typeof periods[number]) => setPeriod(period);

    const handleTabChange = (event: SyntheticEvent, newValue: number) => setTabValue(newValue);

    const handleChangeByDateChartDisplayed = (event: ChangeEvent<HTMLInputElement>) => {
        setByDateChartDisplayed((event.target as HTMLInputElement).value as "value" | "units");
    };

    useEffect(() => {
        setStartAndEndDate(
            getStartAndEndDates(
                period,
                salesData[0].dateTime.toString(),
                salesData[salesData.length - 1].dateTime.toString()
            )
        );
    }, [period]);

    return (
        <div className='grid grid-cols-12 gap-4 items-center'>
            <div className='fixed top-0 left-14 right-0 px-8 col-span-12 grid grid-cols-12 items-center bg-white z-10'>
                <div className='col-span-12 sm:col-span-2'>
                    <h1>Sales</h1>
                </div>
                <div className='col-span-12 sm:col-span-4'>
                    <TimePeriodSelect period={period} onPeriodChange={onPeriodChange} />
                </div>
                <div className='col-span-12 sm:col-span-6 text-right'>
                    <Link href='/sales/add' passHref>
                        <CTAButton type='link' color='secondary' heavyRounding={false} size='medium'>
                            <AddIcon fontSize='small' className='mr-2' />
                            Add Sales
                        </CTAButton>
                    </Link>
                </div>
            </div>
            <div className='mt-32 col-span-12 grid grid-cols-3 grid-rows-2 grid-flow-col justify-center'>
                <div className='flex flex-col'>
                    <span className='text-zinc-500 text-lg text-center'>Total Sales</span>
                    <Counter
                        to={productInstances
                            .filter((inst) =>
                                dayjs(inst.saleTransaction.dateTime).isBetween(
                                    startAndEndDate.startDate,
                                    startAndEndDate.endDate,
                                    "days",
                                    "[]"
                                )
                            )
                            .reduce((acc, curr) => acc + curr.finalSalePrice, 0)}
                        style='currency'
                        className='text-blueyonder-500 text-3xl text-center mb-8'
                    />
                </div>
                <div className='flex flex-col'>
                    <span className='text-zinc-500 text-lg text-center'>Avg. Daily Sales</span>
                    <Counter
                        to={
                            productInstances.reduce(
                                (acc, inst) =>
                                    dayjs(inst.saleTransaction?.dateTime).isBetween(
                                        startAndEndDate.startDate,
                                        startAndEndDate.endDate,
                                        "days",
                                        "[]"
                                    )
                                        ? acc + inst.finalSalePrice
                                        : acc,

                                0
                            ) /
                            (dayjs(startAndEndDate.endDate).diff(startAndEndDate.startDate, "days") + 1)
                        }
                        style='currency'
                        className='text-blueyonder-500 text-3xl text-center mb-8'
                    />
                </div>
                <div className='flex flex-col'>
                    <span className='text-zinc-500 text-lg text-center'>Total Units Sold</span>
                    <Counter
                        to={
                            productInstances.filter((inst) =>
                                dayjs(inst.saleTransaction.dateTime).isBetween(
                                    startAndEndDate.startDate,
                                    startAndEndDate.endDate,
                                    "days",
                                    "[]"
                                )
                            ).length
                        }
                        className='text-blueyonder-500 text-3xl text-center'
                    />
                </div>
                <div className='flex flex-col'>
                    <span className='text-zinc-500 text-lg text-center'>Avg. Daily Units Sold</span>
                    <Counter
                        to={
                            productInstances.filter((inst) =>
                                dayjs(inst.saleTransaction?.dateTime).isBetween(
                                    startAndEndDate.startDate,
                                    startAndEndDate.endDate,
                                    "days",
                                    "[]"
                                )
                            ).length /
                            (dayjs(startAndEndDate.endDate).diff(startAndEndDate.startDate, "days") + 1)
                        }
                        decimalPlaces={1}
                        className='text-blueyonder-500 text-3xl text-center mb-8'
                    />
                </div>
                <div className='flex flex-col'>
                    <span className='text-zinc-500 text-lg text-center'>Best Day ($)</span>
                    <span className='text-blueyonder-500 text-3xl text-center mb-8'>
                        {
                            Object.entries(
                                productInstances.reduce((dayCount, inst) => {
                                    if (
                                        !dayjs(inst.saleTransaction?.dateTime).isBetween(
                                            startAndEndDate.startDate,
                                            startAndEndDate.endDate,
                                            "days",
                                            "[]"
                                        )
                                    ) {
                                        return dayCount;
                                    }
                                    const day = dayjs(inst.saleTransaction.dateTime).format("ddd, MMM DD, YYYY");
                                    dayCount[day] = (dayCount[day] || 0) + inst.finalSalePrice;
                                    return dayCount;
                                }, {})
                            ).sort((dayA: [string, number], dayB: [string, number]) => dayA[1] - dayB[1])[0][0]
                        }
                    </span>
                </div>

                <div className='flex flex-col'>
                    <span className='text-zinc-500 text-lg text-center'>Most Pop. Category</span>
                    <span className='text-blueyonder-500 text-3xl text-center mb-8'>
                        {
                            Object.entries(
                                productInstances.reduce((catCount, inst) => {
                                    if (
                                        !dayjs(inst.saleTransaction?.dateTime).isBetween(
                                            startAndEndDate.startDate,
                                            startAndEndDate.endDate,
                                            "days",
                                            "[]"
                                        )
                                    ) {
                                        return catCount;
                                    }
                                    const categoryName = inst.product.category.name;
                                    catCount[categoryName] = (catCount[categoryName] || 0) + 1;
                                    return catCount;
                                }, {})
                            ).sort((catA: [string, number], catB: [string, number]) => catA[1] - catB[1])[0][0]
                        }
                    </span>
                </div>
            </div>
            <div className='col-span-12'>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    aria-label='by-date-tab'
                    className='max-h-12'
                    //variant='scrollable'
                    scrollButtons='auto'
                    // allowScrollButtonsMobile // MUI v5
                >
                    <Tab
                        key={"by-date"}
                        label='By Date'
                        value={0}
                        className='border border-zinc-100 font-semibold rounded-tl-sm rounded-tr-sm'
                    />
                    <Tab
                        key={"by-product"}
                        label='By Product'
                        value={1}
                        className='border border-zinc-100 font-semibold rounded-tl-sm rounded-tr-sm'
                    />
                    <Tab
                        key={"by-source"}
                        label='By Source'
                        value={2}
                        className='border border-zinc-100 font-semibold rounded-tl-sm rounded-tr-sm'
                    />
                </Tabs>
            </div>
            <div className='col-span-12'>
                <TabPanel value={0} index={tabValue}>
                    <div className='grid grid-cols-12 py-4 px-8'>
                        <h2 className='col-span-3'>Timeline of Sales</h2>
                        <div className='col-span-9 flex items-center'>
                            <FormControl>
                                <RadioGroup
                                    row
                                    aria-labelledby='by-date-chart-type-radio-buttons-group'
                                    name='by-date-chart-type-radio-buttons-group'
                                    value={byDateChartDisplayed}
                                    onChange={handleChangeByDateChartDisplayed}
                                >
                                    <FormControlLabel value='value' control={<Radio />} label='$ Value' />
                                    <FormControlLabel value='units' control={<Radio />} label='# Units' />
                                </RadioGroup>
                            </FormControl>
                        </div>

                        <div className='col-span-9'>
                            {byDateChartDisplayed === "value" ? (
                                <SalesTimeLineChart period={period} productInstances={productInstances} />
                            ) : (
                                <UnitsSoldChart period={period} productInstances={productInstances} />
                            )}
                        </div>
                        <h2 className='col-span-12 mt-16'>Sales Records by Day</h2>
                        <div className='col-span-12'>
                            <SalesRecordsTable
                                summaryByDate={getSaleTransactionsSummaryByDate(
                                    salesData.filter((st) =>
                                        dayjs(st.dateTime).isBetween(
                                            startAndEndDate.startDate,
                                            startAndEndDate.endDate,
                                            "days",
                                            "[]"
                                        )
                                    )
                                )}
                            />
                        </div>
                    </div>
                </TabPanel>
            </div>
        </div>
    );
};

export default SalesPage;
