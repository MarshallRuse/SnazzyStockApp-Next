import { SyntheticEvent, useState } from "react";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday";

import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TableSortLabel,
} from "@mui/material";
import type { SaleTransactionsSummaryByDate } from "lib/interfaces/SaleTransactionsSummaryByDate";
import { descendingComparator, getComparator, stableSort } from "lib/utils/tables/sorting";

dayjs.extend(weekday);

const headCells = [
    { id: "date", numeric: true, disablePadding: false, label: "Date" },
    { id: "location", numeric: false, disablePadding: false, label: "Location" },
    { id: "numTransactions", numeric: true, disablePadding: false, label: "Transactions" },
    { id: "unitsSold", numeric: true, disablePadding: false, label: "Units Sold" },
    { id: "revenue", numeric: true, disablePadding: false, label: "Revenue" },
    { id: "costOfGoodsSold", numeric: true, disablePadding: false, label: "Cost of Goods Sold" },
    { id: "grossMargin", numeric: true, disablePadding: false, label: "Gross Margin" },
];

type EnhancedTableHeadProps = {
    order: "asc" | "desc";
    orderBy: string;
    onRequestSort: (e: SyntheticEvent, p: string) => void;
};

const EnhancedTableHead = ({ order, orderBy, onRequestSort }: EnhancedTableHeadProps) => {
    const createSortHandler = (property: string) => (event: SyntheticEvent) => {
        onRequestSort(event, property);
    };

    return (
        <TableHead>
            <TableRow style={{ verticalAlign: "top" }}>
                {headCells.map((headCell) => {
                    return (
                        <TableCell
                            key={headCell.id}
                            className={headCellStyling}
                            align={headCell.numeric ? "right" : "left"}
                            padding={headCell.disablePadding ? "none" : "normal"}
                            sortDirection={orderBy === headCell.id ? order : false}
                        >
                            <TableSortLabel
                                active={orderBy === headCell.id}
                                direction={orderBy === headCell.id ? order : "asc"}
                                onClick={createSortHandler(headCell.id)}
                            >
                                {headCell.label}
                            </TableSortLabel>
                        </TableCell>
                    );
                })}
            </TableRow>
        </TableHead>
    );
};

const headCellStyling = "border-b-2 border-bluegreen-500";

type EnhancedTableProps = {
    summaryByDate: SaleTransactionsSummaryByDate[];
};

export default function EnhancedTable({ summaryByDate }: EnhancedTableProps) {
    const router = useRouter();

    const [order, setOrder] = useState<"asc" | "desc">("desc");
    const [orderBy, setOrderBy] = useState("date");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleRequestSort = (event: SyntheticEvent, property: string) => {
        const isAsc = orderBy === property && order === "asc";
        setOrder(isAsc ? "desc" : "asc");
        setOrderBy(property);
    };

    const handleRowClick = (date: string) => {
        router.push(`/sales/by_date/${dayjs(date).format("YYYY-MM-DD")}`);
    };

    const handleChangePage = (event: SyntheticEvent, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <div className='w-full'>
            <Paper className='w-full mb-2'>
                <TableContainer>
                    <Table className='min-w-[750px]' aria-labelledby='tableTitle' aria-label='enhanced table'>
                        <EnhancedTableHead order={order} orderBy={orderBy} onRequestSort={handleRequestSort} />
                        <TableBody>
                            {stableSort(summaryByDate, getComparator(order, orderBy))
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row, index) => (
                                    <TableRow
                                        hover
                                        tabIndex={-1}
                                        key={`${row.sku}-${index}`}
                                        className='cursor-pointer'
                                        onClick={() => handleRowClick(row.date)}
                                    >
                                        <TableCell align='left'>{dayjs(row.date).format("MMM DD, YYYY")}</TableCell>
                                        <TableCell align='left'>
                                            {row.location !== "" ? row.location : <em>Not Recorded</em>}
                                        </TableCell>
                                        <TableCell align='right'>{row.numTransactions}</TableCell>
                                        <TableCell align='right'>{row.unitsSold}</TableCell>
                                        <TableCell align='right'>
                                            {new Intl.NumberFormat("en-CA", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            }).format(row.revenue)}
                                        </TableCell>
                                        <TableCell align='right'>
                                            {new Intl.NumberFormat("en-CA", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            }).format(row.costOfGoodsSold)}
                                        </TableCell>
                                        <TableCell
                                            align='right'
                                            className={row.grossMargin > 0 ? "text-green-600" : "text-cerise-600"}
                                        >
                                            {new Intl.NumberFormat("en-CA", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            }).format(row.grossMargin)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component='div'
                    count={summaryByDate.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>
        </div>
    );
}
