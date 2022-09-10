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
import type { ChartData } from "chart.js";
import { Line } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip, Legend, ChartDataLabels);

type TimeLineChartProps = {
    chartData: ChartData<"line", number[], unknown>;
    yAxisLabel: { display: boolean; text: string };
    tooltipLabel: { valueType: "default" | "currency"; label: string; backgroundColor: string };
};
const TimeLineChart = ({ chartData, yAxisLabel, tooltipLabel }: TimeLineChartProps) => {
    return (
        <div className='grid grid-cols-12 justify-center'>
            <div className='col-span-12 sm:col-span-10'>
                <Line
                    data={chartData}
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
                                backgroundColor: tooltipLabel.backgroundColor,
                                borderColor: "#000",
                                bodySpacing: 5,
                                padding: 15,
                                displayColors: false,
                                callbacks: {
                                    title: (tooltipItems) => {
                                        return tooltipItems[0].label;
                                    },
                                    label: (tooltipItem) => {
                                        let value =
                                            tooltipLabel.valueType === "default"
                                                ? tooltipItem.dataset.data[tooltipItem.dataIndex]
                                                : new Intl.NumberFormat("en-CA", {
                                                      style: "currency",
                                                      currency: "CAD",
                                                  }).format(tooltipItem.dataset.data[tooltipItem.dataIndex] as number);

                                        return `${
                                            // if multiset in future, use callback like (tooltipItem.datasetIndex) => tooltipItem.datasetIndex === 0 ? "Sales Revenue" : "Purchase Cost"
                                            tooltipLabel.label
                                        }: ${value}`;
                                    },
                                },
                            },
                        },
                        scales: {
                            y: {
                                title: {
                                    display: yAxisLabel.display,
                                    text: yAxisLabel.text,
                                    padding: { top: 0, bottom: 20 },
                                },
                                suggestedMax: 2,
                            },
                        },
                    }}
                />
            </div>
        </div>
    );
};

export default TimeLineChart;
