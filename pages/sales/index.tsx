import Link from "next/link";
import { unstable_getServerSession } from "next-auth/next";
import { authOptions } from "pages/api/auth/[...nextauth]";
import { prisma } from "lib/prisma";
import { Add as AddIcon } from "@mui/icons-material";
import { locationAbbreviations } from "lib/utils/locations";
import SalesRecordsTable from "components/tables/SalesRecordsTable";
import CTAButton from "components/CTAButton";
import type { GetServerSideProps } from "next";
import type { SaleTransactionSummary } from "lib/interfaces/SaleTransactionSummary";
import type { SaleTransactionsSummaryByDate } from "lib/interfaces/SaleTransactionsSummaryByDate";
import dayjs from "dayjs";

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

    const saleTransactions = await prisma.saleTransaction.findMany({
        where: {
            status: "COMPLETE",
        },
        select: {
            id: true,
            dateTime: true,
            city: true,
            provinceState: true,
            country: true,
            source: {
                select: {
                    type: true,
                },
            },
            productInstances: {
                select: {
                    id: true,
                    invoiceCostCAD: true,
                    finalSalePrice: true,
                },
            },
        },
    });

    // group the transactions ourself, as prisma wont count relations in a groupBy
    const groupBy = <TItem,>(
        items: TItem[],
        key: string,
        keyTransformation: (k: string) => string = (k) => k
    ): { [key: string]: TItem[] } =>
        items.reduce((result, item) => {
            return {
                ...result,
                [keyTransformation(item[key])]: [...(result[keyTransformation(item[key])] || []), item],
            };
        }, {});

    const dateTimeGroups: SaleTransactionSummary[][] = Object.values(
        groupBy(saleTransactions, "dateTime", (k) => dayjs(k).format("YYYY-MM-DD"))
    );
    const summaryByDate: SaleTransactionsSummaryByDate[] = dateTimeGroups.map((group) => {
        const revenue = group.reduce(
            (acc, curr) =>
                acc + curr.productInstances.reduce((accInner, currInner) => accInner + currInner.finalSalePrice, 0),
            0
        );
        const costOfGoodsSold = group.reduce(
            (acc, curr) =>
                acc + curr.productInstances.reduce((accInner, currInner) => accInner + currInner.invoiceCostCAD, 0),
            0
        );
        return {
            date: dayjs(group[0]?.dateTime).format("YYYY-MM-DD"),
            // TODO: fix this up, use Google Places API or something for larger list of names
            location: `${group[0]?.city !== null ? `${group[0]?.city}, ` : ""}${
                group[0]?.provinceState !== null
                    ? `${locationAbbreviations.find((lA) => lA.name === group[0]?.provinceState).abbreviation}, `
                    : ""
            }${group[0]?.country !== null ? (group[0]?.country === "Canada" ? "CA" : group[0]?.country) : ""}`,
            numTransactions: group.length,
            unitsSold: group.reduce((acc, curr) => acc + curr.productInstances.length, 0),
            revenue,
            costOfGoodsSold,
            grossMargin: revenue - costOfGoodsSold,
        };
    });

    return {
        props: {
            summaryByDate: JSON.parse(JSON.stringify(summaryByDate)),
        },
    };
};

type SalesPageProps = {
    summaryByDate: SaleTransactionsSummaryByDate[];
};

const SalesPage = ({ summaryByDate }: SalesPageProps) => {
    return (
        <div className='grid grid-cols-12 gap-4 items-center'>
            <div className='col-span-12 sm:col-span-9'>
                <h1>Sales</h1>
            </div>
            <div className='col-span-12 sm:col-span-3 text-right'>
                <Link href='/sales/add' passHref>
                    <CTAButton type='link' color='secondary' heavyRounding={false} size='medium' disabled>
                        <AddIcon fontSize='small' className='mr-2' />
                        Add Sales
                    </CTAButton>
                </Link>
            </div>
            <div className='col-span-12'>
                <SalesRecordsTable summaryByDate={summaryByDate} />
            </div>
        </div>
    );
};

export default SalesPage;
