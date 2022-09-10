import dayjs from "dayjs";
import { locationAbbreviations } from "lib/utils/locations";
import type { SaleTransactionSummary } from "lib/interfaces/SaleTransactionSummary";
import type { SaleTransactionsSummaryByDate } from "lib/interfaces/SaleTransactionsSummaryByDate";
import type { SaleTransactionDetails } from "lib/interfaces/SaleTransactionDetails";
import type { ProductInstanceWithPurchaseAndSaleData } from "lib/interfaces/ProductInstanceWithPurchaseAndSaleData";

// group the transactions ourself, as prisma wont count relations in a groupBy
const groupBy = <TItem>(
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

export const getSaleTransactionsSummaryByDate = (
    saleTransactions: SaleTransactionSummary[] | SaleTransactionDetails[]
): SaleTransactionsSummaryByDate[] => {
    const dateTimeGroups: SaleTransactionSummary[][] = Object.values(
        groupBy(saleTransactions, "dateTime", (k) => dayjs(k).format("YYYY-MM-DD"))
    );

    return dateTimeGroups.map((group) => {
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
            numSources: group.filter((st, ind, self) => self.findIndex((s) => s.source.type === st.source.type) === ind)
                .length,
            unitsSold: group.reduce((acc, curr) => acc + curr.productInstances.length, 0),
            revenue,
            costOfGoodsSold,
            grossMargin: revenue - costOfGoodsSold,
        };
    });
};

export const salesTransactionDetailsToProductInstances = (
    salesData: SaleTransactionDetails[]
): ProductInstanceWithPurchaseAndSaleData[] => {
    return salesData
        .map((sdd) =>
            sdd.productInstances.map((inst) => {
                const instMod = { ...inst, saleTransaction: { ...sdd } };
                delete instMod.saleTransaction.productInstances; // shape it to be like a default SaleTransaction
                return instMod;
            })
        )
        .flat();
};
