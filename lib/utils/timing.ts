import dayjs from "dayjs";
import { periods } from "lib/interfaces/Periods";
import { ProductInstanceWithPurchaseAndSaleData } from "lib/interfaces/ProductInstanceWithPurchaseAndSaleData";

export const getStartAndEndDates = (
    period: typeof periods[number],
    firstDate?: string,
    lastDate?: string
): { startDate: string | undefined; endDate: string | undefined } => {
    let startDate: string;
    let endDate: string;

    switch (period) {
        case "Today":
            startDate = dayjs().format("YYYY-MM-DD");
            endDate = startDate;
            break;
        case "Yesterday":
            startDate = dayjs().subtract(1, "day").format("YYYY-MM-DD");
            endDate = startDate;
            break;
        case "Last 7 Days":
            endDate = dayjs().format("YYYY-MM-DD");
            startDate = dayjs().subtract(1, "week").format("YYYY-MM-DD");
            break;
        case "Last 30 Days":
            endDate = dayjs().format("YYYY-MM-DD");
            startDate = dayjs().subtract(1, "month").format("YYYY-MM-DD");
            break;
        case "This Month":
            endDate = dayjs().format("YYYY-MM-DD");
            startDate = dayjs().startOf("month").format("YYYY-MM-DD");
            break;
        case "This Year":
            endDate = dayjs().format("YYYY-MM-DD");
            startDate = dayjs().startOf("year").format("YYYY-MM-DD");
            break;
        case "Last Year":
            endDate = dayjs().format("YYYY-MM-DD");
            startDate = dayjs().subtract(1, "year").format("YYYY-MM-DD");
            break;
        case "All Time":
            endDate = dayjs(lastDate).format("YYYY-MM-DD");
            startDate = dayjs(firstDate).format("YYYY-MM-DD");
            break;
        case "Custom":
            endDate = dayjs(lastDate).format("YYYY-MM-DD");
            startDate = dayjs(firstDate).format("YYYY-MM-DD");
            break;
    }

    return { startDate, endDate };
};

export const calculateStartEndDates = (
    timeframe: string,
    productInstances: ProductInstanceWithPurchaseAndSaleData[],
    timingParameters?: {
        yearSelected: number;
        startMonth: number;
        startYear: number;
        endMonth: number;
        endYear: number;
    }
) => {
    const { yearSelected, startMonth, startYear, endMonth, endYear } = timingParameters;
    let start: dayjs.Dayjs;
    let end = dayjs();

    switch (timeframe) {
        case "6-months":
            start = end.clone().subtract(6, "months");
            break;
        case "year-to-date":
            start = end.clone().subtract(12, "months");
            break;
        case "year-calendar":
            start = dayjs().year(yearSelected).month(0).date(1).hour(0).minute(0).second(0).millisecond(0);
            end = end.year(yearSelected).month(11).date(31).hour(0).minute(0).second(0).millisecond(0);
            break;
        case "all-time":
            if (productInstances.length > 0) {
                const sortedPurchasedProdInstances = productInstances.sort((firstInst, secondInst) => {
                    return dayjs(firstInst.purchaseOrder.date).diff(dayjs(secondInst.purchaseOrder.date), "days");
                });
                start = dayjs(sortedPurchasedProdInstances[0]?.purchaseOrder.date);
            } else {
                start = dayjs();
            }
            break;
        case "first-purchase-last-sale":
            if (productInstances.length > 0) {
                const sortedPurchasedProdInstances = productInstances.sort((firstInst, secondInst) => {
                    return dayjs(firstInst.purchaseOrder.date).diff(dayjs(secondInst.purchaseOrder.date), "days");
                });
                start = dayjs(sortedPurchasedProdInstances[0].purchaseOrder.date);

                const sortedSoldProdInstances = productInstances
                    .filter((inst) => inst.saleTransaction !== null)
                    .sort((firstInst, secondInst) => {
                        return dayjs(firstInst.saleTransaction.dateTime).diff(
                            dayjs(secondInst.saleTransaction.dateTime),
                            "days"
                        );
                    });
                end =
                    sortedSoldProdInstances.length > 0
                        ? dayjs(sortedSoldProdInstances[sortedSoldProdInstances.length - 1].saleTransaction.dateTime)
                        : dayjs();
            } else {
                start = dayjs();
                end = dayjs();
            }
            break;
        case "custom":
            start = dayjs().year(startYear).month(startMonth).date(1);
            end = dayjs().year(endYear).month(endMonth).date(31);
            break;
        default:
            start = dayjs();
    }

    return {
        start: start.format("YYYY-MM-DD"),
        end: end.format("YYYY-MM-DD"),
    };
};
