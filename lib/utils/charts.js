import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);

export const generateMonthYears = (startDate, endDate) => {

    const monthYears = [];

    let start = dayjs(startDate);
    let end = dayjs(endDate);
    // Math.round b/c dayjs truncates int number of months when true not passed as third paramter
    let numMonths = Math.round(end.diff(start, 'months', true));  
  
    for (let i = numMonths; i >= 0; i -= 1) {
        let dateMonth = end.clone().subtract(i, 'months').format('MMM-YY');
        monthYears.push(dateMonth);
    }
    return monthYears;
}

export const generateWeeks = (startDate, endDate) => {

    const dates = [];
    let start = dayjs(startDate);
    let end = dayjs(endDate);
    let numWeeks = end.diff(start, 'weeks');

    for (let i = numWeeks; i >= 0; i -= 1){
      let day = end.clone().subtract(i, 'weeks').format('DD-MMM-YY');
      dates.push(day);
    }
    return dates;
}

export const generateDates = (startDate, endDate) => {

    const dates = [];
    let start = dayjs(startDate);
    let end = dayjs(endDate);
    let numDays = end.diff(start, 'days');

    for (let i = numDays; i >= 0; i -= 1){
      let day = end.clone().subtract(i, 'days').format('DD-MMM-YY');
      dates.push(day);
    }
    return dates;
}

export const generateTimes = (interval = 1) => {

    const times = [];
    let start = dayjs().hour(0).minute(0);
    let end = dayjs().hour(23).minute(59);
    let numMinutes = end.diff(start, 'minutes');

    for (let i = numMinutes; i >= 0; i -= interval){
        let time = end.clone().subtract(i, 'minutes').format('HH:mm');
        times.push(time);
    }
    return times;
}

export const categorizeProductInstancesByMonth = (startDate, endDate, prodInstances) => {

    // Filter the product instances for those that have been sold
    const soldProdInstances = prodInstances.filter(inst => inst.Sale_Transaction_ID !== null && inst.SaleDateTime !== null);
    // sort sold product instances oldest to newest
    const sortedSoldProdInstances = soldProdInstances.sort((firstInst, secondInst) => {
        return dayjs(firstInst.SaleDateTime).diff(dayjs(secondInst.SaleDateTime), 'days');
    });

    // sort purchased product instances oldest to newest
    const sortedPurchasedProdInstances = prodInstances.sort((firstInst, secondInst) => {
        return dayjs(firstInst.PODate).diff(dayjs(secondInst.PODate), 'days');
    })

    // Convert list of product instances to a list of objects, each containing
    // the month of Sale, and the product instances sold that month
    console.log("startDate: ", startDate)
    const monthYears = generateMonthYears(startDate, endDate);
    console.log("monthYearsL", monthYears)
    const groupingsByMonthYear = monthYears.map(monthYear => ({
        monthYear,
        purchases: sortedPurchasedProdInstances.filter(inst => dayjs(inst.PODate).format('MMM-YY') === monthYear),
        sales: sortedSoldProdInstances.filter(inst => dayjs(inst.SaleDateTime).format("MMM-YY") === monthYear)
    }));
    console.log("groupingsByMonthYear: ", groupingsByMonthYear)
    return groupingsByMonthYear;
  }


// export const categorizeProductInstancesByWeek = (startDate, endDate, prodInstances) => {

// }
  
export const categorizeProductInstancesByDay = (startDate, endDate, prodInstances) => {
    // Filter the product instances for those that have been sold
    const soldProdInstances = prodInstances.filter(inst => inst.Sale_Transaction_ID !== null && inst.SaleDateTime !== null);
    // sort sold product instances oldest to newest
    const sortedSoldProdInstances = soldProdInstances.sort((firstInst, secondInst) => {
        return dayjs(firstInst.SaleDateTime).diff(dayjs(secondInst.SaleDateTime), 'days');
    });

    // sort purchased product instances oldest to newest
    const sortedPurchasedProdInstances = prodInstances.sort((firstInst, secondInst) => {
        return dayjs(firstInst.PODate).diff(dayjs(secondInst.PODate), 'days');
    });

    // Convert list of product instances to a list of objects, each containing
    // the date of Sale, and the product instances sold that day
    const dates = generateDates(startDate, endDate);
    const groupingsByDates = dates.map(date => ({
        date,
        purchases: sortedPurchasedProdInstances.filter(inst => dayjs(inst.PODate).format('DD-MMM-YY') === date),
        sales: sortedSoldProdInstances.filter(inst => dayjs(inst.SaleDateTime).format("DD-MMM-YY") === date)
    }));

    return groupingsByDates;
}

export const categorizeProductInstancesByTime = (prodInstances, timeInterval = 30) => {
    // Filter the product instances for those that have been sold
    const soldProdInstances = prodInstances.filter(inst => inst.Sale_Transaction_ID !== null && inst.SaleDateTime !== null);
    // sort sold product instances oldest to newest
    const sortedSoldProdInstances = soldProdInstances.sort((firstInst, secondInst) => {
        return dayjs(firstInst.SaleDateTime).diff(dayjs(secondInst.SaleDateTime), 'minutes');
    });
    console.log("sortedSoldProdInstances ", sortedSoldProdInstances)
    // sort purchased product instances oldest to newest
    const sortedPurchasedProdInstances = prodInstances.sort((firstInst, secondInst) => {
        return dayjs(firstInst.PODate).diff(dayjs(secondInst.PODate), 'minutes');
    });

    // Convert list of product instances to a list of objects, each containing
    // the time of Sale, and the product instances sold at that time
    const times = generateTimes(timeInterval);
    const groupingsByTimes = times.map(time => {
        const hour = time.split(":")[0];
        const minute = time.split(":")[1];
        const startTime = dayjs().hour(hour).minute(minute);

        // console.log("time: ", time)
        // console.log("dayjs(sortedSoldProdInstances[0].SaleDateTime): ", dayjs(sortedSoldProdInstances[0].SaleDateTime))
        // console.log("startTime: ", dayjs(startTime));
        // console.log("endTime: ", dayjs(startTime).clone().add(timeInterval, 'minutes'))
        // console.log("isBetween? ", dayjs(sortedSoldProdInstances[0].SaleDateTime).isBetween(startTime, startTime.clone().add(timeInterval, 'minutes')))
        return ({
            time: dayjs().hour(hour).minute(minute).format('hh:mm A'),
            purchases: timeInterval === 1 
                ? sortedPurchasedProdInstances.filter(inst => dayjs(inst.PODate).format('hh:mm A') === startTime.format('hh:mm A'))
                : sortedPurchasedProdInstances.filter(inst => dayjs().hour(dayjs(inst.PODate).hour()).minute(dayjs(inst.PODate).minute()).isBetween(startTime, startTime.clone().add(timeInterval, 'minutes'))),
            sales: timeInterval === 1
                ? sortedSoldProdInstances.filter(inst => dayjs(inst.SaleDateTime).format("hh:mm A") === startTime.format('hh:mm A'))
                : sortedSoldProdInstances.filter(inst => dayjs().hour(dayjs(inst.SaleDateTime).hour()).minute(dayjs(inst.SaleDateTime).minute()).isBetween(startTime, startTime.clone().add(timeInterval, 'minutes')))
    })});
    //console.log("groupingsByTimes: ", groupingsByTimes)
    return groupingsByTimes;
}

export const getLinearGradient = (ctx, chartArea, colorsAndStops = []) => {
    let width, height, gradient;
    const chartWidth = chartArea.right - chartArea.left;
    const chartHeight = chartArea.bottom - chartArea.top;
    if (gradient === null || width !== chartWidth || height !== chartHeight) {
        // Create the gradient because this is either the first render
        // or the size of the chart has changed
        width = chartWidth;
        height = chartHeight;
        gradient = ctx.createLinearGradient(0, 0, 0, chartArea.bottom);
        for (let i = 0; i < colorsAndStops.length; i++){
            gradient.addColorStop(colorsAndStops[i].stop, colorsAndStops[i].color);
        }
        
    }

    return gradient;
}

export const getRadialGradient = (context, colorsAndStops = []) => {
    let width, height;
    const cache = new Map();
    const chartArea = context.chart.chartArea;
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
        const r = Math.min(
            (chartArea.right - chartArea.left) / 2,
            (chartArea.bottom - chartArea.top) / 2
        );
        var ctx = context.chart.ctx;
        gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, r);
        for (let i = 0; i < colorsAndStops.length; i++){
            gradient.addColorStop(colorsAndStops[i].stop, colorsAndStops[i].color);
        }
        cache.set(colorsAndStops.reduce((prev, curr) => prev + curr.color, ""), gradient);
    }
  
    return gradient;
}