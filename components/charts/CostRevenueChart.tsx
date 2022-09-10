import { useState, useEffect } from "react";
import { FormControl, FormControlLabel, Radio, RadioGroup } from "@mui/material";

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
import type { ChartData, ScatterDataPoint } from "chart.js";
import { Line } from "react-chartjs-2";
import { CHART_COLOR_PROFIT, CHART_COLOR_LOSS } from "lib/utils/colors";
import {
    categorizeProductInstancesByMonth,
    categorizeProductInstancesByDay,
    categorizeProductInstancesByTime,
    getLinearGradient,
} from "lib/utils/charts";
import { darken, transparentize } from "color2k";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { ProductInstanceWithPurchaseAndSaleData } from "lib/interfaces/ProductInstanceWithPurchaseAndSaleData";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip, Legend, ChartDataLabels);

type CostRevenueChartProps = {
    startDate?: string;
    endDate?: string;
    displayMode: "single-day";
    productInstances: ProductInstanceWithPurchaseAndSaleData[];
};
const CostRevenueChart = ({ startDate, endDate, displayMode, productInstances = [] }: CostRevenueChartProps) => {
    const [dateResolutionControlValue, setDateResolutionControlValue] = useState("Months");
    const [data, setData] = useState<ChartData<"line", number[], unknown>>({
        labels: [],
        datasets: [
            {
                label: "Sales",
                data: [],
                fill: "origin",
                borderColor: CHART_COLOR_PROFIT,
                datalabels: {
                    anchor: "end",
                    align: "end",
                    color: "rgba(75,192,192,1)",
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
            {
                label: "Purchases",
                data: [],
                fill: "origin",
                borderColor: CHART_COLOR_LOSS,
                datalabels: {
                    anchor: "end",
                    align: "end",
                    color: "#742774",
                    display: false,
                    offset: 10,
                    formatter: function (value) {
                        if (value > 0) {
                            return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(value);
                        } else {
                            return "";
                        }
                    },
                },
            },
        ],
    });

    const handleDateResolutionControlChange = (e) => setDateResolutionControlValue(e.target.value);

    useEffect(() => {
        let costRevenueData: {
            time?: string;
            monthYear?: string;
            date?: string;
            purchases: ProductInstanceWithPurchaseAndSaleData[];
            sales: ProductInstanceWithPurchaseAndSaleData[];
        }[];
        let labels: string[];
        let salesData: number[];
        let purchasesData: number[];

        if (startDate === endDate || displayMode === "single-day") {
            setDateResolutionControlValue(undefined);
            costRevenueData = categorizeProductInstancesByTime(productInstances);
            console.log("costRevenueDate: ", costRevenueData);
            labels = costRevenueData.map((obj) => obj?.time);
            salesData = costRevenueData.map((obj) => obj.sales.reduce((prev, curr) => prev + curr.finalSalePrice, 0));
            purchasesData = [];
        } else if (dateResolutionControlValue === "Months") {
            costRevenueData = categorizeProductInstancesByMonth(startDate, endDate, productInstances);
            labels = costRevenueData.map((obj) => obj.monthYear);
            salesData = costRevenueData.map((obj) => obj.sales.reduce((prev, curr) => prev + curr.finalSalePrice, 0));
            purchasesData = costRevenueData.map((obj) =>
                obj.purchases.reduce((prev, curr) => prev + curr.invoiceCostCAD, 0)
            );
        } else {
            costRevenueData = categorizeProductInstancesByDay(startDate, endDate, productInstances);
            labels = costRevenueData.map((obj) => obj.date);
            salesData = costRevenueData.map((obj) => obj.sales.reduce((prev, curr) => prev + curr.finalSalePrice, 0));
            purchasesData = [];
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
                                return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
                                    value
                                );
                            } else {
                                return "";
                            }
                        },
                    },
                },
                {
                    label: "Purchases",
                    data: purchasesData,
                    fill: "origin",
                    backgroundColor: function (context) {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) {
                            // This case happens on initial chart load
                            return null;
                        }
                        const colorsAndStops = [
                            { stop: 0, color: CHART_COLOR_LOSS },
                            { stop: 1, color: transparentize(CHART_COLOR_LOSS, 1) },
                        ];
                        return getLinearGradient(ctx, chartArea, colorsAndStops);
                    },
                    borderColor: CHART_COLOR_LOSS,
                    datalabels: {
                        anchor: "end",
                        align: "end",
                        color: darken(CHART_COLOR_LOSS, 0.15),
                        display: false,
                        offset: 10,
                        formatter: function (value) {
                            if (value > 0) {
                                return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
                                    value
                                );
                            } else {
                                return "";
                            }
                        },
                    },
                },
            ],
        };

        setData(chartData);
    }, [productInstances, startDate, endDate, displayMode, dateResolutionControlValue]);

    return (
        <div className='grid grid-cols-12 justify-center'>
            {!(startDate === endDate || displayMode === "single-day") && (
                <div className='col-span-12 text-center'>
                    <FormControl component='span'>
                        <RadioGroup
                            row
                            aria-label='date-resolution-control'
                            name='dateResolutionControl'
                            value={dateResolutionControlValue}
                            onChange={handleDateResolutionControlChange}
                        >
                            <FormControlLabel value='Months' control={<Radio />} label='Months' />
                            <FormControlLabel value='Days' control={<Radio />} label='Days' />
                        </RadioGroup>
                    </FormControl>
                </div>
            )}

            <div className='col-span-12 sm:col-span-10'>
                <Line
                    data={data}
                    options={{
                        devicePixelRatio: 2,
                        elements: {
                            point: {
                                borderWidth: 0,
                                hoverBorderWidth: 6,
                                radius: 5,
                                hoverRadius: 4,
                            },
                        },
                        interaction: {
                            intersect: false,
                            mode: "index",
                        },
                        plugins: {
                            tooltip: {
                                backgroundColor: (tooltipItem) => {
                                    let tooltipColor;
                                    if (dateResolutionControlValue === "Months") {
                                        if (
                                            tooltipItem.tooltip.dataPoints[0].raw >
                                            tooltipItem.tooltip.dataPoints[1].raw
                                        ) {
                                            tooltipColor = CHART_COLOR_PROFIT;
                                        } else if (
                                            tooltipItem.tooltip.dataPoints[0].raw <
                                            tooltipItem.tooltip.dataPoints[1].raw
                                        ) {
                                            tooltipColor = CHART_COLOR_LOSS;
                                        } else {
                                            tooltipColor = "rgba(75,75,75,0.9)";
                                        }
                                    } else {
                                        tooltipColor = CHART_COLOR_PROFIT;
                                    }

                                    return tooltipColor;
                                },
                                borderColor: "#000",
                                bodySpacing: 5,
                                padding: 15,
                                displayColors: false,
                                callbacks: {
                                    title: (tooltipItems) => {
                                        return tooltipItems[0].label;
                                    },
                                    label: (tooltipItem) => {
                                        let value = new Intl.NumberFormat("en-CA", {
                                            style: "currency",
                                            currency: "CAD",
                                        }).format(tooltipItem.dataset.data[tooltipItem.dataIndex] as number);

                                        return `${
                                            tooltipItem.datasetIndex === 0 ? "Sales Revenue" : "Purchase Cost"
                                        }: ${value}`;
                                    },
                                },
                            },
                        },
                        scales: {
                            y: {
                                title: {
                                    display: true,
                                    text: "$ (CAD)",
                                    padding: { top: 0, bottom: 20 },
                                },
                            },
                        },
                    }}
                />
            </div>
        </div>
    );
};

export default CostRevenueChart;
