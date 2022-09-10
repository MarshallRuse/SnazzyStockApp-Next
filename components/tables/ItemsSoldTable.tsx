import { useState } from "react";
import { useRouter } from "next/router";
import PropTypes from "prop-types";
import dayjs from "dayjs";

import {
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TableSortLabel,
    Toolbar,
    Tooltip,
    Typography,
} from "@mui/material";
import FilterList from "@mui/icons-material/FilterList";
import { descendingComparator, getComparator, stableSort } from "lib/utils/tables/sorting";
import type { SyntheticEvent } from "react";
import { ProductInstanceWithProductData } from "lib/interfaces/ProductInstanceWithProductData";
import { SaleTransactionDetails } from "lib/interfaces/SaleTransactionDetails";
import { ItemsSoldTableRow } from "lib/interfaces/ItemsSoldTableData";

const headCells = [
    { id: "transactionNumber", numeric: false, disablePadding: false, label: "Sale #" },
    { id: "time", numeric: false, disablePadding: false, label: "Time" },
    { id: "sku", numeric: false, disablePadding: false, label: "SKU" },
    { id: "productName", numeric: false, disablePadding: false, label: "Product Name" },
    { id: "unitsSold", numeric: true, disablePadding: false, label: "Units Sold" },
    { id: "cost", numeric: true, disablePadding: false, label: "Cost" },
    { id: "revenue", numeric: true, disablePadding: false, label: "Revenue" },
    { id: "grossMargin", numeric: true, disablePadding: false, label: "Gross Margin" },
    { id: "source", numeric: false, disablePadding: false, label: "Source" },
];

const headCellStyling = "border-b-2 border-bluegreen-500";

type EnhancedTableHeadProps = {
    order: "asc" | "desc";
    orderBy: string;
    onRequestSort: (e: SyntheticEvent, p: string) => void;
    listSupplier?: boolean;
};

const EnhancedTableHead = ({ order, orderBy, onRequestSort, listSupplier = false }: EnhancedTableHeadProps) => {
    const createSortHandler = (property) => (event) => {
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

type ItemsSoldTableProps = {
    itemsSold: ItemsSoldTableRow[];
};

export default function ItemsSoldTable({ itemsSold = [] }: ItemsSoldTableProps) {
    const router = useRouter();

    const [order, setOrder] = useState<"asc" | "desc">("desc");
    const [orderBy, setOrderBy] = useState("date");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const handleRequestSort = (event, property) => {
        const isAsc = orderBy === property && order === "asc";
        setOrder(isAsc ? "desc" : "asc");
        setOrderBy(property);
    };

    const handleRowClick = (id) => {
        router.push(`/sales/by_transaction/${id}`);
    };

    const handleChangePage = (event, newPage) => {
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
                            {stableSort(itemsSold, getComparator(order, orderBy))
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row: ItemsSoldTableRow, index: number) => {
                                    const labelId = `enhanced-table-${index}`;

                                    return (
                                        <TableRow
                                            hover
                                            tabIndex={-1}
                                            key={`${row.sku}-${index}`}
                                            className='cursor-pointer'
                                            onClick={() => handleRowClick(row.saleTransactionId)}
                                        >
                                            <TableCell align='left'>{row.transactionNumber}</TableCell>
                                            <TableCell align='left'>{row.time}</TableCell>
                                            <TableCell align='left'>{row.sku}</TableCell>
                                            <TableCell align='left'>{row.productName}</TableCell>
                                            <TableCell align='right'>{row.unitsSold}</TableCell>
                                            <TableCell align='right'>
                                                {new Intl.NumberFormat("en-CA", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                }).format(row.cost)}
                                            </TableCell>
                                            <TableCell align='right'>
                                                {new Intl.NumberFormat("en-CA", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                }).format(row.revenue)}
                                            </TableCell>
                                            <TableCell
                                                align='right'
                                                className={row.grossMargin > 0 ? "text-green-600" : "text-red-600"}
                                            >
                                                {new Intl.NumberFormat("en-CA", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                }).format(row.grossMargin)}
                                            </TableCell>
                                            <TableCell align='left'>{row.source}</TableCell>
                                        </TableRow>
                                    );
                                })}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component='div'
                    count={itemsSold.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>
        </div>
    );
}
