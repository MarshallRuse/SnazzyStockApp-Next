import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import type { ProductInstanceWithPurchaseAndSaleData } from "lib/interfaces/ProductInstanceWithPurchaseAndSaleData";

dayjs.extend(isBetween);

export const generateMonthYears = (startDate: string, endDate: string): string[] => {
    const monthYears = [];

    let start = dayjs(startDate);
    let end = dayjs(endDate);
    // Math.round b/c dayjs truncates int number of months when true not passed as third paramter
    let numMonths = Math.round(end.diff(start, "months", true));
    console.log(`start: ${start}; end: ${end}; numMonths: ${numMonths}`);

    for (let i = numMonths; i >= 0; i -= 1) {
        let dateMonth = end.clone().subtract(i, "months").format("MMM-YY");
        monthYears.push(dateMonth);
    }
    return monthYears;
};

export const generateWeeks = (startDate: string, endDate: string): string[] => {
    const dates = [];
    let start = dayjs(startDate);
    let end = dayjs(endDate);
    let numWeeks = end.diff(start, "weeks");

    for (let i = numWeeks; i >= 0; i -= 1) {
        let day = end.clone().subtract(i, "weeks").format("DD-MMM-YY");
        dates.push(day);
    }
    return dates;
};

export const generateDates = (startDate: string, endDate: string): string[] => {
    const dates = [];
    let start = dayjs(startDate);
    let end = dayjs(endDate);
    let numDays = end.diff(start, "days");

    for (let i = numDays; i >= 0; i -= 1) {
        let day = end.clone().subtract(i, "days").format("DD-MMM-YY");
        dates.push(day);
    }
    return dates;
};

export const generateTimes = (interval = 1): string[] => {
    const times = [];
    let start = dayjs().hour(0).minute(0);
    let end = dayjs().hour(23).minute(59);
    let numMinutes = end.diff(start, "minutes");

    for (let i = numMinutes; i >= 0; i -= interval) {
        let time = end.clone().subtract(i, "minutes").format("HH:mm");
        times.push(time);
    }
    return times;
};

export const groupProductInstancesByMonth = (
    startDate: string,
    endDate: string,
    prodInstances: ProductInstanceWithPurchaseAndSaleData[]
): {
    monthYear: string;
    purchases: ProductInstanceWithPurchaseAndSaleData[];
    sales: ProductInstanceWithPurchaseAndSaleData[];
}[] => {
    // Filter the product instances for those that have been sold
    const soldProdInstances = prodInstances.filter(
        (inst) => inst.saleTransactionId !== null && inst.saleTransaction.dateTime !== null
    );
    // sort sold product instances oldest to newest
    const sortedSoldProdInstances = soldProdInstances.sort((firstInst, secondInst) => {
        return dayjs(firstInst.saleTransaction.dateTime).diff(dayjs(secondInst.saleTransaction.dateTime), "days");
    });

    // sort purchased product instances oldest to newest
    const sortedPurchasedProdInstances = prodInstances.sort((firstInst, secondInst) => {
        return dayjs(firstInst.purchaseOrder.date).diff(dayjs(secondInst.purchaseOrder.date), "days");
    });

    // Convert list of product instances to a list of objects, each containing
    // the month of Sale, and the product instances sold that month
    const monthYears = generateMonthYears(startDate, endDate);
    console.log("monthYears: ", monthYears);
    const groupingsByMonthYear = monthYears.map((monthYear) => ({
        monthYear,
        purchases: sortedPurchasedProdInstances.filter(
            (inst) => dayjs(inst.purchaseOrder.date).format("MMM-YY") === monthYear
        ),
        sales: sortedSoldProdInstances.filter(
            (inst) => dayjs(inst.saleTransaction.dateTime).format("MMM-YY") === monthYear
        ),
    }));
    return groupingsByMonthYear;
};

// export const categorizeProductInstancesByWeek = (startDate, endDate, prodInstances) => {

// }

export const groupProductInstancesByDay = (
    startDate: string,
    endDate: string,
    prodInstances: ProductInstanceWithPurchaseAndSaleData[]
): {
    date: string;
    purchases: ProductInstanceWithPurchaseAndSaleData[];
    sales: ProductInstanceWithPurchaseAndSaleData[];
}[] => {
    // Filter the product instances for those that have been sold
    const soldProdInstances = prodInstances.filter(
        (inst) => inst.saleTransactionId !== null && inst.saleTransaction.dateTime !== null
    );
    // sort sold product instances oldest to newest
    const sortedSoldProdInstances = soldProdInstances.sort((firstInst, secondInst) => {
        return dayjs(firstInst.saleTransaction.dateTime).diff(dayjs(secondInst.saleTransaction.dateTime), "days");
    });

    // sort purchased product instances oldest to newest
    const sortedPurchasedProdInstances = prodInstances.sort((firstInst, secondInst) => {
        return dayjs(firstInst.purchaseOrder.date).diff(dayjs(secondInst.purchaseOrder.date), "days");
    });

    // Convert list of product instances to a list of objects, each containing
    // the date of Sale, and the product instances sold that day
    const dates = generateDates(startDate, endDate);
    const groupingsByDates = dates.map((date) => ({
        date,
        purchases: sortedPurchasedProdInstances.filter(
            (inst) => dayjs(inst.purchaseOrder.date).format("DD-MMM-YY") === date
        ),
        sales: sortedSoldProdInstances.filter(
            (inst) => dayjs(inst.saleTransaction.dateTime).format("DD-MMM-YY") === date
        ),
    }));

    return groupingsByDates;
};

export const groupProductInstancesByTime = (
    prodInstances: ProductInstanceWithPurchaseAndSaleData[],
    timeInterval = 30
): {
    time: string;
    purchases: ProductInstanceWithPurchaseAndSaleData[];
    sales: ProductInstanceWithPurchaseAndSaleData[];
}[] => {
    // Filter the product instances for those that have been sold
    const soldProdInstances = prodInstances.filter(
        (inst) => inst.saleTransactionId !== null && inst.saleTransaction.dateTime !== null
    );
    // sort sold product instances oldest to newest
    const sortedSoldProdInstances = soldProdInstances.sort((firstInst, secondInst) => {
        return dayjs(firstInst.saleTransaction.dateTime).diff(dayjs(secondInst.saleTransaction.dateTime), "minutes");
    });
    console.log("sortedSoldProdInstances ", sortedSoldProdInstances);
    // sort purchased product instances oldest to newest
    const sortedPurchasedProdInstances = prodInstances.sort((firstInst, secondInst) => {
        return dayjs(firstInst.purchaseOrder.date).diff(dayjs(secondInst.purchaseOrder.date), "minutes");
    });

    // Convert list of product instances to a list of objects, each containing
    // the time of Sale, and the product instances sold at that time
    const times = generateTimes(timeInterval);
    const groupingsByTimes = times.map((time) => {
        const hour = parseInt(time.split(":")[0]);
        const minute = parseInt(time.split(":")[1]);
        const startTime = dayjs().hour(hour).minute(minute);

        // console.log("time: ", time)
        // console.log("dayjs(sortedSoldProdInstances[0].SaleDateTime): ", dayjs(sortedSoldProdInstances[0].SaleDateTime))
        // console.log("startTime: ", dayjs(startTime));
        // console.log("endTime: ", dayjs(startTime).clone().add(timeInterval, 'minutes'))
        // console.log("isBetween? ", dayjs(sortedSoldProdInstances[0].SaleDateTime).isBetween(startTime, startTime.clone().add(timeInterval, 'minutes')))
        return {
            time: dayjs().hour(hour).minute(minute).format("hh:mm A"),
            purchases:
                timeInterval === 1
                    ? sortedPurchasedProdInstances.filter(
                          (inst) => dayjs(inst.purchaseOrder.date).format("hh:mm A") === startTime.format("hh:mm A")
                      )
                    : sortedPurchasedProdInstances.filter((inst) =>
                          dayjs()
                              .hour(dayjs(inst.purchaseOrder.date).hour())
                              .minute(dayjs(inst.purchaseOrder.date).minute())
                              .isBetween(startTime, startTime.clone().add(timeInterval, "minutes"))
                      ),
            sales:
                timeInterval === 1
                    ? sortedSoldProdInstances.filter(
                          (inst) =>
                              dayjs(inst.saleTransaction.dateTime).format("hh:mm A") === startTime.format("hh:mm A")
                      )
                    : sortedSoldProdInstances.filter((inst) =>
                          dayjs()
                              .hour(dayjs(inst.saleTransaction.dateTime).hour())
                              .minute(dayjs(inst.saleTransaction.dateTime).minute())
                              .isBetween(startTime, startTime.clone().add(timeInterval, "minutes"))
                      ),
        };
    });
    //console.log("groupingsByTimes: ", groupingsByTimes)
    return groupingsByTimes;
};
