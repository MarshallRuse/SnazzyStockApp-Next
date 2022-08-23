import dayjs from 'dayjs';

export const calculateStartEndDates = (timeframe, productInstances, timingParameters = {
    yearSelected: "", startMonth: "", startYear: "", endMonth: "", endYear: ""
}) => {

    const { yearSelected, startMonth, startYear, endMonth, endYear } = timingParameters;
    let start;
    let end = dayjs();

    switch (timeframe){
        case '6-months':
            start = end.clone().subtract(6, 'months');
            break;
        case 'year-to-date':
            start = end.clone().subtract(12, 'months');
            break;
        case 'year-calendar':
            start = dayjs().year(yearSelected).month(0).date(1).hour(0).minute(0).second(0).millisecond(0);
            end = end.year(yearSelected).month(11).date(31).hour(0).minute(0).second(0).millisecond(0);
            break;
        case 'all-time':
            if (productInstances.length > 0){
                const sortedPurchasedProdInstances = productInstances.sort((firstInst, secondInst) => {
                    return dayjs(firstInst.PODate).diff(dayjs(secondInst.PODate), 'days');
                });
                start = dayjs(sortedPurchasedProdInstances[0].PODate);
            } else {
                start = dayjs();
            }
            break;
        case 'first-purchase-last-sale':
            if (productInstances.length > 0){
                const sortedPurchasedProdInstances = productInstances.sort((firstInst, secondInst) => {
                    return dayjs(firstInst.PODate).diff(dayjs(secondInst.PODate), 'days');
                });
                start = dayjs(sortedPurchasedProdInstances[0].PODate);
                
                const sortedSoldProdInstances = productInstances
                    .filter(inst => inst.Sale_Transaction_ID !== null)
                    .sort((firstInst, secondInst) => {
                        return dayjs(firstInst.SaleDateTime).diff(dayjs(secondInst.SaleDateTime), 'days');
                    });
                end = sortedSoldProdInstances.length > 0 ? dayjs(sortedSoldProdInstances[sortedSoldProdInstances.length - 1].SaleDateTime) : dayjs();
            } else {
                start = dayjs();
                end = dayjs();
            }
            break;
        case 'custom':
            start = dayjs().year(startYear).month(startMonth).date(1);
            end = dayjs().year(endYear).month(endMonth).date(31);
            break;
        default:
            start = dayjs();
    }

    return ({
        start: start.format('YYYY-MM-DD'),
        end: end.format('YYYY-MM-DD')
    });
}