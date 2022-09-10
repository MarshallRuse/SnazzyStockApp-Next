import { useContext } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from "chart.js";
import { TailwindColorContext } from "lib/contexts/TailwindColorContext";
import { CHART_COLOR_PROFIT } from "lib/utils/colors";
import { getLinearGradient } from "lib/utils/charts";
import { darken, transparentize } from "color2k";
import ChartDataLabels from "chartjs-plugin-datalabels";
import TimeLineChart from "./TimeLineChart";
import type { ChartData } from "chart.js";
import type { ProductInstanceWithPurchaseAndSaleData } from "lib/interfaces/ProductInstanceWithPurchaseAndSaleData";
import {
    groupProductInstancesByDay,
    groupProductInstancesByMonth,
    groupProductInstancesByTime,
} from "lib/utils/groupProductInstances";
import { periods } from "lib/interfaces/Periods";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { getStartAndEndDates } from "lib/utils/timing";
dayjs.extend(isBetween);

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip, Legend, ChartDataLabels);

type SalesTimeLineChartProps = {
    period: typeof periods[number];
    customPeriod?: { startDate: string; endDate: string };
    productInstances: ProductInstanceWithPurchaseAndSaleData[];
};
const SalesTimeLineChart = ({ period, customPeriod, productInstances = [] }: SalesTimeLineChartProps) => {
    const colors = useContext(TailwindColorContext);

    let costRevenueData: {
        time?: string;
        monthYear?: string;
        date?: string;
        purchases: ProductInstanceWithPurchaseAndSaleData[];
        sales: ProductInstanceWithPurchaseAndSaleData[];
    }[];
    let labels: string[];
    let salesData: number[];

    const sortedProdInstances = productInstances.sort((instA, instB) =>
        dayjs(instA.saleTransaction?.dateTime).diff(dayjs(instB.saleTransaction?.dateTime))
    );

    let startDate: string;
    let endDate: string;
    let dates = getStartAndEndDates(period);

    switch (period) {
        case "Today":
            costRevenueData = groupProductInstancesByTime(
                sortedProdInstances.filter((inst) => dayjs(inst.saleTransaction.dateTime).isSame(dayjs(), "day"))
            );
            labels = costRevenueData.map((obj) => obj?.time);
            salesData = costRevenueData.map((obj) => obj.sales.reduce((prev, curr) => prev + curr.finalSalePrice, 0));
            break;
        case "Yesterday":
            costRevenueData = groupProductInstancesByTime(
                sortedProdInstances.filter((inst) =>
                    dayjs(inst.saleTransaction.dateTime).isSame(dayjs().subtract(1, "day"), "day")
                )
            );
            labels = costRevenueData.map((obj) => obj?.time);
            salesData = costRevenueData.map((obj) => obj.sales.reduce((prev, curr) => prev + curr.finalSalePrice, 0));
            break;
        case "Last 7 Days":
            startDate = dates.startDate;
            endDate = dates.endDate;
            costRevenueData = groupProductInstancesByDay(
                startDate,
                endDate,
                sortedProdInstances.filter((inst) =>
                    dayjs(inst.saleTransaction?.dateTime).isBetween(startDate, endDate, "days", "[]")
                )
            );
            labels = costRevenueData.map((obj) => obj.date);
            salesData = costRevenueData.map((obj) => obj.sales.reduce((prev, curr) => prev + curr.finalSalePrice, 0));
            break;
        case "Last 30 Days":
            startDate = dates.startDate;
            endDate = dates.endDate;
            costRevenueData = groupProductInstancesByDay(
                startDate,
                endDate,
                sortedProdInstances.filter((inst) =>
                    dayjs(inst.saleTransaction?.dateTime).isBetween(startDate, endDate, "days", "[]")
                )
            );
            labels = costRevenueData.map((obj) => obj.date);
            salesData = costRevenueData.map((obj) => obj.sales.reduce((prev, curr) => prev + curr.finalSalePrice, 0));
            break;
        case "This Month":
            startDate = dates.startDate;
            endDate = dates.endDate;
            costRevenueData = groupProductInstancesByDay(
                startDate,
                endDate,
                sortedProdInstances.filter((inst) =>
                    dayjs(inst.saleTransaction?.dateTime).isBetween(startDate, endDate, "days", "[]")
                )
            );
            labels = costRevenueData.map((obj) => obj.date);
            salesData = costRevenueData.map((obj) => obj.sales.reduce((prev, curr) => prev + curr.finalSalePrice, 0));
            break;
        case "This Year":
            startDate = dates.startDate;
            endDate = dates.endDate;
            costRevenueData = groupProductInstancesByMonth(
                startDate,
                endDate,
                sortedProdInstances.filter((inst) =>
                    dayjs(inst.saleTransaction?.dateTime).isBetween(startDate, endDate, "days", "[]")
                )
            );
            labels = costRevenueData.map((obj) => obj.monthYear);
            salesData = costRevenueData.map((obj) => obj.sales.reduce((prev, curr) => prev + curr.finalSalePrice, 0));
            break;
        case "Last Year":
            startDate = dates.startDate;
            endDate = dates.endDate;
            costRevenueData = groupProductInstancesByMonth(
                startDate,
                endDate,
                sortedProdInstances.filter((inst) =>
                    dayjs(inst.saleTransaction?.dateTime).isBetween(startDate, endDate, "days", "[]")
                )
            );
            labels = costRevenueData.map((obj) => obj.monthYear);
            salesData = costRevenueData.map((obj) => obj.sales.reduce((prev, curr) => prev + curr.finalSalePrice, 0));
            break;
        case "All Time":
            dates = getStartAndEndDates(
                period,
                sortedProdInstances[0]?.saleTransaction.dateTime.toString(),
                sortedProdInstances[sortedProdInstances.length - 1]?.saleTransaction.dateTime.toString()
            );
            startDate = dates.startDate;
            endDate = dates.endDate;
            costRevenueData = groupProductInstancesByMonth(startDate, endDate, sortedProdInstances);
            labels = costRevenueData.map((obj) => obj.monthYear);
            salesData = costRevenueData.map((obj) => obj.sales.reduce((prev, curr) => prev + curr.finalSalePrice, 0));
            break;
        case "Custom":
            dates = getStartAndEndDates(period, customPeriod.startDate, customPeriod.endDate);
            startDate = dates.startDate;
            endDate = dates.endDate;
            const timeDifference = dayjs(endDate).diff(dayjs(startDate), "days");
            const duration = timeDifference > 30 ? "Months" : timeDifference > 1 ? "Days" : "Day";
            if (duration === "Months") {
                costRevenueData = groupProductInstancesByMonth(
                    startDate,
                    endDate,
                    sortedProdInstances.filter((inst) =>
                        dayjs(inst.saleTransaction?.dateTime).isBetween(startDate, endDate, "days", "[]")
                    )
                );
                labels = costRevenueData.map((obj) => obj.monthYear);
                salesData = costRevenueData.map((obj) =>
                    obj.sales.reduce((prev, curr) => prev + curr.finalSalePrice, 0)
                );
            } else if (duration === "Days") {
                costRevenueData = groupProductInstancesByDay(
                    startDate,
                    endDate,
                    sortedProdInstances.filter((inst) =>
                        dayjs(inst.saleTransaction?.dateTime).isBetween(startDate, endDate, "days", "[]")
                    )
                );
                labels = costRevenueData.map((obj) => obj.date);
                salesData = costRevenueData.map((obj) =>
                    obj.sales.reduce((prev, curr) => prev + curr.finalSalePrice, 0)
                );
            } else {
                costRevenueData = groupProductInstancesByTime(
                    sortedProdInstances.filter((inst) =>
                        dayjs(inst.saleTransaction?.dateTime).isBetween(startDate, endDate, "days", "[]")
                    )
                );
                labels = costRevenueData.map((obj) => obj?.time);
                salesData = costRevenueData.map((obj) =>
                    obj.sales.reduce((prev, curr) => prev + curr.finalSalePrice, 0)
                );
            }

            break;
        default:
            startDate = dayjs().format("YYYY-MM-DD");
            endDate = dayjs(sortedProdInstances[sortedProdInstances.length - 1]?.saleTransaction.dateTime).format(
                "YYYY-MM-DD"
            );
            startDate = dayjs(sortedProdInstances[0]?.saleTransaction.dateTime).format("YYYY-MM-DD");
            costRevenueData = groupProductInstancesByMonth(startDate, endDate, sortedProdInstances);
            labels = costRevenueData.map((obj) => obj.monthYear);
            salesData = costRevenueData.map((obj) => obj.sales.reduce((prev, curr) => prev + curr.finalSalePrice, 0));
    }

    const chartData: ChartData<"line", number[], unknown> = {
        labels,
        datasets: [
            {
                label: "Sales",
                data: salesData,
                fill: "origin",
                backgroundColor: function (context) {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) {
                        // This case happens on initial chart load
                        return null;
                    }
                    const colorsAndStops = [
                        { stop: 0, color: CHART_COLOR_PROFIT },
                        { stop: 1, color: transparentize(CHART_COLOR_PROFIT, 1) },
                    ];
                    return getLinearGradient(ctx, chartArea, colorsAndStops);
                },
                borderColor: CHART_COLOR_PROFIT,
                datalabels: {
                    anchor: "end",
                    align: "end",
                    color: darken(CHART_COLOR_PROFIT, 0.1),
                    display: false,
                    offset: 10,
                    formatter: function (value, context) {
                        if (value > 0) {
                            return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(value);
                        } else {
                            return "";
                        }
                    },
                },
            },
        ],
    };

    return (
        <TimeLineChart
            chartData={chartData}
            yAxisLabel={{ display: true, text: "$ (CAD)" }}
            tooltipLabel={{ valueType: "currency", label: "Sales Revenue", backgroundColor: colors.green[600] }}
        />
    );
};

export default SalesTimeLineChart;
