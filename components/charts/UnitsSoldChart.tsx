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

import { CHART_COLORS } from "lib/utils/colors";
import { TailwindColorContext } from "lib/contexts/TailwindColorContext";
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

type UnitsSoldChartProps = {
    period: typeof periods[number];
    customPeriod?: { startDate: string; endDate: string };
    productInstances: ProductInstanceWithPurchaseAndSaleData[];
};

const UnitsSoldChart = ({ period, customPeriod, productInstances = [] }: UnitsSoldChartProps) => {
    const colors = useContext(TailwindColorContext);

    let unitsSoldData: {
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
            unitsSoldData = groupProductInstancesByTime(
                sortedProdInstances.filter((inst) => dayjs(inst.saleTransaction.dateTime).isSame(dayjs(), "day"))
            );
            labels = unitsSoldData.map((obj) => obj?.time);
            salesData = unitsSoldData.map((obj) => obj.sales.length);
            break;
        case "Yesterday":
            unitsSoldData = groupProductInstancesByTime(
                sortedProdInstances.filter((inst) =>
                    dayjs(inst.saleTransaction.dateTime).isSame(dayjs().subtract(1, "day"), "day")
                )
            );
            labels = unitsSoldData.map((obj) => obj?.time);
            salesData = unitsSoldData.map((obj) => obj.sales.length);
            break;
        case "Last 7 Days":
            startDate = dates.startDate;
            endDate = dates.endDate;
            unitsSoldData = groupProductInstancesByDay(
                startDate,
                endDate,
                sortedProdInstances.filter((inst) =>
                    dayjs(inst.saleTransaction?.dateTime).isBetween(startDate, endDate, "days", "[]")
                )
            );
            labels = unitsSoldData.map((obj) => obj.date);
            salesData = unitsSoldData.map((obj) => obj.sales.length);
            break;
        case "Last 30 Days":
            startDate = dates.startDate;
            endDate = dates.endDate;
            unitsSoldData = groupProductInstancesByDay(
                startDate,
                endDate,
                sortedProdInstances.filter((inst) =>
                    dayjs(inst.saleTransaction?.dateTime).isBetween(startDate, endDate, "days", "[]")
                )
            );
            labels = unitsSoldData.map((obj) => obj.date);
            salesData = unitsSoldData.map((obj) => obj.sales.length);
            break;
        case "This Month":
            startDate = dates.startDate;
            endDate = dates.endDate;
            unitsSoldData = groupProductInstancesByDay(
                startDate,
                endDate,
                sortedProdInstances.filter((inst) =>
                    dayjs(inst.saleTransaction?.dateTime).isBetween(startDate, endDate, "days", "[]")
                )
            );
            labels = unitsSoldData.map((obj) => obj.date);
            salesData = unitsSoldData.map((obj) => obj.sales.length);
            break;
        case "This Year":
            startDate = dates.startDate;
            endDate = dates.endDate;
            unitsSoldData = groupProductInstancesByMonth(
                startDate,
                endDate,
                sortedProdInstances.filter((inst) =>
                    dayjs(inst.saleTransaction?.dateTime).isBetween(startDate, endDate, "days", "[]")
                )
            );
            labels = unitsSoldData.map((obj) => obj.monthYear);
            salesData = unitsSoldData.map((obj) => obj.sales.length);
            break;
        case "Last Year":
            startDate = dates.startDate;
            endDate = dates.endDate;
            unitsSoldData = groupProductInstancesByMonth(
                startDate,
                endDate,
                sortedProdInstances.filter((inst) =>
                    dayjs(inst.saleTransaction?.dateTime).isBetween(startDate, endDate, "days", "[]")
                )
            );
            labels = unitsSoldData.map((obj) => obj.monthYear);
            salesData = unitsSoldData.map((obj) => obj.sales.length);
            break;
        case "All Time":
            dates = getStartAndEndDates(
                period,
                sortedProdInstances[0]?.saleTransaction.dateTime.toString(),
                sortedProdInstances[sortedProdInstances.length - 1]?.saleTransaction.dateTime.toString()
            );
            startDate = dates.startDate;
            endDate = dates.endDate;
            unitsSoldData = groupProductInstancesByMonth(startDate, endDate, sortedProdInstances);
            labels = unitsSoldData.map((obj) => obj.monthYear);
            salesData = unitsSoldData.map((obj) => obj.sales.length);
            break;
        case "Custom":
            dates = getStartAndEndDates(period, customPeriod.startDate, customPeriod.endDate);
            startDate = dates.startDate;
            endDate = dates.endDate;
            const timeDifference = dayjs(endDate).diff(dayjs(startDate), "days");
            const duration = timeDifference > 30 ? "Months" : timeDifference > 1 ? "Days" : "Day";
            if (duration === "Months") {
                unitsSoldData = groupProductInstancesByMonth(
                    startDate,
                    endDate,
                    sortedProdInstances.filter((inst) =>
                        dayjs(inst.saleTransaction?.dateTime).isBetween(startDate, endDate, "days", "[]")
                    )
                );
                labels = unitsSoldData.map((obj) => obj.monthYear);
                salesData = unitsSoldData.map((obj) => obj.sales.length);
            } else if (duration === "Days") {
                unitsSoldData = groupProductInstancesByDay(
                    startDate,
                    endDate,
                    sortedProdInstances.filter((inst) =>
                        dayjs(inst.saleTransaction?.dateTime).isBetween(startDate, endDate, "days", "[]")
                    )
                );
                labels = unitsSoldData.map((obj) => obj.date);
                salesData = unitsSoldData.map((obj) => obj.sales.length);
            } else {
                unitsSoldData = groupProductInstancesByTime(
                    sortedProdInstances.filter((inst) =>
                        dayjs(inst.saleTransaction?.dateTime).isBetween(startDate, endDate, "days", "[]")
                    )
                );
                labels = unitsSoldData.map((obj) => obj?.time);
                salesData = unitsSoldData.map((obj) => obj.sales.length);
            }

            break;
        default:
            startDate = dayjs().format("YYYY-MM-DD");
            endDate = dayjs(sortedProdInstances[sortedProdInstances.length - 1]?.saleTransaction.dateTime).format(
                "YYYY-MM-DD"
            );
            startDate = dayjs(sortedProdInstances[0]?.saleTransaction.dateTime).format("YYYY-MM-DD");
            unitsSoldData = groupProductInstancesByMonth(startDate, endDate, sortedProdInstances);
            labels = unitsSoldData.map((obj) => obj.monthYear);
            salesData = unitsSoldData.map((obj) => obj.sales.length);
    }

    const chartData: ChartData<"line", number[], unknown> = {
        labels,
        datasets: [
            {
                label: "Units Sold",
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
                        { stop: 0, color: CHART_COLORS[0] },
                        { stop: 1, color: transparentize(CHART_COLORS[0], 1) },
                    ];
                    return getLinearGradient(ctx, chartArea, colorsAndStops);
                },
                borderColor: CHART_COLORS[0],
                datalabels: {
                    anchor: "end",
                    align: "end",
                    color: darken(CHART_COLORS[0], 0.1),
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
            yAxisLabel={{ display: true, text: "# Sold" }}
            tooltipLabel={{ valueType: "default", label: "Units Sold", backgroundColor: colors.blueyonder[500] }}
        />
    );
};

export default UnitsSoldChart;
