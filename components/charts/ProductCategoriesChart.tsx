import { useState, useEffect } from "react";
import { FormControl, FormControlLabel, Grid, Radio, RadioGroup } from "@mui/material";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import type { ChartData, PieDataPoint } from "chart.js";
import { getHoverColor } from "chart.js/helpers";
import { saturate, lighten, darken, toRgba } from "color2k";
import { Pie } from "react-chartjs-2";
import ChartDataLabels, { Context } from "chartjs-plugin-datalabels";

import { getRadialGradient } from "../../lib/utils/charts";

import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { ProductInstanceWithProductData } from "lib/interfaces/ProductInstanceWithProductData";
dayjs.extend(isBetween);

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

type ProductCategoriesChartProps = {
    startDate?: string;
    endDate?: string;
    productCategoriesData: {
        category: string;
        items: ProductInstanceWithProductData[];
        color: string;
    }[];
};
const ProductCategoriesChart = ({ startDate, endDate, productCategoriesData = [] }: ProductCategoriesChartProps) => {
    const [productCategoryControlValue, setProductCategoryControlValue] = useState("Units Purchased");
    const [labelsToDisplay, setLabelsToDisplay] = useState<string[]>([]);
    const [dataToDisplay, setDataToDisplay] = useState<number[]>([]);
    const [colorsToDisplay, setColorsToDisplay] = useState<string[]>([]);
    const [data, setData] = useState<ChartData<"pie", PieDataPoint[], unknown>>({
        labels: [],
        datasets: [
            {
                data: [],
                backgroundColor: [],
                hoverOffset: 20,
                datalabels: {
                    anchor: "end",
                    align: "end",
                    offset: 10,
                    formatter: function (value, context) {
                        return context.chart.data.labels[context.dataIndex];
                    },
                },
            },
        ],
    });

    const handleProductCategoryControlChange = (e) => setProductCategoryControlValue(e.target.value);

    useEffect(() => {
        // The data displayed depends on the productCategoryBreakdown prop
        switch (productCategoryControlValue) {
            case "Units Purchased":
                const prodCatData =
                    startDate && endDate
                        ? productCategoriesData.map((obj) => {
                              const filteredItems = obj.items.filter((item) =>
                                  dayjs(item.purchaseOrder.date).isBetween(startDate, endDate, null, "[]")
                              );
                              return {
                                  ...obj,
                                  items: filteredItems,
                              };
                          })
                        : productCategoriesData;
                setLabelsToDisplay(prodCatData.filter((obj) => obj.items.length > 0).map((obj) => obj.category));
                setDataToDisplay(
                    productCategoriesData.filter((obj) => obj.items.length > 0).map((obj) => obj.items.length)
                );
                setColorsToDisplay(productCategoriesData.filter((obj) => obj.items.length > 0).map((obj) => obj.color));
                break;
            case "Units Sold":
                setLabelsToDisplay(
                    productCategoriesData
                        .filter((obj) => obj.items.filter((inst) => inst.saleTransactionId !== null).length > 0)
                        .map((obj) => obj.category)
                );
                setDataToDisplay(
                    productCategoriesData
                        .map((obj) => obj.items.filter((inst) => inst.saleTransactionId !== null).length)
                        .filter((len) => len > 0)
                );
                setColorsToDisplay(
                    productCategoriesData
                        .filter((obj) => obj.items.filter((inst) => inst.saleTransactionId !== null).length > 0)
                        .map((obj) => obj.color)
                );
                break;
            case "Cost":
                setLabelsToDisplay(productCategoriesData.map((obj) => obj.category));
                setDataToDisplay(
                    productCategoriesData.map((obj) =>
                        obj.items.reduce((prev, curr) => {
                            return prev + curr.invoiceCostCAD;
                        }, 0)
                    )
                );
                setColorsToDisplay(productCategoriesData.map((obj) => obj.color));
                break;
            case "Profit":
                setLabelsToDisplay(
                    productCategoriesData
                        .filter((obj) => obj.items.filter((inst) => inst.saleTransactionId !== null).length > 0)
                        .map((obj) => obj.category)
                );
                const dd = productCategoriesData.map((obj) =>
                    obj.items.filter((inst) => inst.saleTransactionId !== null)
                );
                /** .reduce((prev, curr) => {
                        return prev + (curr.Final_Sale_Price - curr.Invoice_Cost_CAD);
                    }, 0))
                    .filter(profit =>  profit > 0)*/
                console.log("dd: ", dd);
                setDataToDisplay(
                    productCategoriesData
                        .map((obj) =>
                            obj.items
                                .filter((inst) => inst.saleTransactionId !== null)
                                .reduce((prev, curr) => {
                                    return prev + (curr.finalSalePrice - curr.invoiceCostCAD);
                                }, 0)
                        )
                        .filter((profit) => profit > 0)
                );
                setColorsToDisplay(
                    productCategoriesData
                        .filter((obj) => obj.items.filter((inst) => inst.saleTransactionId !== null).length > 0)
                        .map((obj) => obj.color)
                );
                break;
            default:
                setDataToDisplay([]);
        }
    }, [productCategoriesData, productCategoryControlValue]);

    useEffect(() => {
        /** NOTE:  For some reason, setting the labels and data 
            on the whole chartData object like below allows the chart to re-render,
            but trying to more concisely set individual properties after copying the chart data 
            (i.e. 
                const chartData = {...data};
                chartData.labels = labelsToDisplay;
                chartData.datasets[0].data = dataToDisplay;
                chartData.datasets[0].backgroundColor = colorsToDisplay;
                setData(chartData)
            )
            doesn't work, so leave the below
        */
        const chartData = {
            labels: labelsToDisplay,
            datasets: [
                {
                    data: dataToDisplay,
                    backgroundColor: function (context) {
                        const { ctx, chartArea } = context.chart;
                        let c = colorsToDisplay[context.dataIndex];
                        if (!c) {
                            return;
                        }
                        if (context.active) {
                            c = getHoverColor(c);
                        }
                        const colorsAndStops = [];

                        colorsAndStops.push({ stop: 1, color: toRgba(saturate(c, 0.1)) });
                        colorsAndStops.push({ stop: 0.8, color: toRgba(lighten(c, 0.005)) });
                        colorsAndStops.push({ stop: 0, color: toRgba(darken(c, 0.25)) });
                        return getRadialGradient(ctx, chartArea, colorsAndStops);
                    },
                    hoverOffset: 20,
                    datalabels: {
                        anchor: "end" as "end",
                        align: "end" as "end",
                        offset: 10,
                        formatter: function (value, context: Context) {
                            return context.chart.data.labels[context.dataIndex];
                        },
                    },
                },
            ],
        };
        setData(chartData);
    }, [labelsToDisplay, dataToDisplay, colorsToDisplay]);

    return (
        <div className='grid grid-cols-12 justify-center'>
            <div className='col-span-12 text-center'>
                <FormControl component='span'>
                    <RadioGroup
                        row
                        aria-label='product-category-control'
                        name='productCategoryControl'
                        value={productCategoryControlValue}
                        onChange={handleProductCategoryControlChange}
                    >
                        <FormControlLabel value='Units Purchased' control={<Radio />} label='Units Purchased' />
                        <FormControlLabel value='Units Sold' control={<Radio />} label='Units Sold' />
                        <FormControlLabel value='Profit' control={<Radio />} label='Profit' />
                        <FormControlLabel value='Cost' control={<Radio />} label='Cost' />
                    </RadioGroup>
                </FormControl>
            </div>
            <div className='col-span-12 sm:col-span-8'>
                <Pie
                    data={data}
                    options={{
                        devicePixelRatio: 2,
                        layout: {
                            padding: { left: 120, bottom: 120, right: 120 },
                        },
                        plugins: {
                            legend: {
                                display: false,
                            },
                            tooltip: {
                                backgroundColor: (tooltipItem) => {
                                    console.log("tooltupItem: ", tooltipItem);
                                    return "#000"; //darkenColor(tooltipItem.tooltip.labelColors[0].backgroundColor, 0.3);
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
                                        //console.log('label tooltipItem: ', tooltipItem)
                                        const value = parseFloat(tooltipItem.formattedValue);
                                        let valueString = "";
                                        if (
                                            productCategoryControlValue === "Cost" ||
                                            productCategoryControlValue === "Profit"
                                        ) {
                                            valueString = new Intl.NumberFormat("en-CA", {
                                                style: "currency",
                                                currency: "CAD",
                                            }).format(value);
                                        }
                                        return `${productCategoryControlValue}: ${value}`;
                                    },
                                },
                            },
                        },
                    }}
                />
            </div>
        </div>
    );
};

export default ProductCategoriesChart;
