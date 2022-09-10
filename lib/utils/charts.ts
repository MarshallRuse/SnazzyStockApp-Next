import type { ChartArea } from "chart.js";

export const getLinearGradient = (
    ctx: CanvasRenderingContext2D,
    chartArea: ChartArea,
    colorsAndStops: { color: string; stop: number }[] = []
) => {
    let width, height, gradient;
    const chartWidth = chartArea.right - chartArea.left;
    const chartHeight = chartArea.bottom - chartArea.top;
    if (gradient === null || width !== chartWidth || height !== chartHeight) {
        // Create the gradient because this is either the first render
        // or the size of the chart has changed
        width = chartWidth;
        height = chartHeight;
        gradient = ctx.createLinearGradient(0, 0, 0, chartArea.bottom);
        for (let i = 0; i < colorsAndStops.length; i++) {
            gradient.addColorStop(colorsAndStops[i].stop, colorsAndStops[i].color);
        }
    }

    return gradient;
};

export const getRadialGradient = (
    ctx: CanvasRenderingContext2D,
    chartArea: ChartArea,
    colorsAndStops: { color: string; stop: number }[] = []
) => {
    let width: number;
    let height: number;
    const cache = new Map();
    if (!chartArea) {
        // This case happens on initial chart load
        return null;
    }

    const chartWidth = chartArea.right - chartArea.left;
    const chartHeight = chartArea.bottom - chartArea.top;
    if (width !== chartWidth || height !== chartHeight) {
        cache.clear();
    }
    let gradient = cache.get(colorsAndStops.reduce((prev, curr) => prev + curr.color, ""));
    if (!gradient) {
        // Create the gradient because this is either the first render
        // or the size of the chart has changed
        width = chartWidth;
        height = chartHeight;
        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.top + chartArea.bottom) / 2;
        const r = Math.min((chartArea.right - chartArea.left) / 2, (chartArea.bottom - chartArea.top) / 2);
        gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, r);
        for (let i = 0; i < colorsAndStops.length; i++) {
            gradient.addColorStop(colorsAndStops[i].stop, colorsAndStops[i].color);
        }
        cache.set(
            colorsAndStops.reduce((prev, curr) => prev + curr.color, ""),
            gradient
        );
    }

    return gradient;
};
