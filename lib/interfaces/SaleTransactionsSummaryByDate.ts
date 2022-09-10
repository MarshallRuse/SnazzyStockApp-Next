export type SaleTransactionsSummaryByDate = {
    salesFound?: boolean;
    date: string;
    location: string;
    numTransactions: number;
    numSources: number;
    unitsSold: number;
    revenue: number;
    costOfGoodsSold: number;
    grossMargin: number;
};
