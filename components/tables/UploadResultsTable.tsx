import { useState } from "react";
import { styled } from "@mui/material/styles";
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    tableCellClasses,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
} from "@mui/material";
import WrappingTooltip from "components/WrappingTooltip";
import { UploadHeaderTransformation } from "lib/interfaces/UploadValueMaps";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
        backgroundColor: theme.palette.primary.main,
        color: "#fff",
    },
    [`&.${tableCellClasses.body}`]: {
        fontSize: 14,
        maxWidth: "150px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "pre",
    },
}));

type ExampleTableProps = {
    headerValues: UploadHeaderTransformation[];
    bodyValues: { value: string | number | boolean }[][];
};

export default function UploadResultsTable({ headerValues = [], bodyValues = [] }: ExampleTableProps) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 700 }} aria-label='customized table'>
                    <TableHead>
                        <TableRow>
                            {headerValues
                                ?.filter((hv) => hv.uploadKey)
                                .map((hv, index) => (
                                    <StyledTableCell key={`ExampleTable-Header-Cell${index}`} component='th'>
                                        {hv.uploadKey}
                                    </StyledTableCell>
                                ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {bodyValues?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) => (
                            <TableRow key={`UploadResultsTable-Body-Row${index}`}>
                                {Object.values(row).map((value, ind) => {
                                    console.log("value: ", value);
                                    return (
                                        <WrappingTooltip
                                            key={`UploadResultsTable-Body-Cell-${index}-${ind}`}
                                            title={value?.toString()}
                                            style={{ whiteSpace: "pre" }}
                                        >
                                            <StyledTableCell>{value?.toString()}</StyledTableCell>
                                        </WrappingTooltip>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component='div'
                count={bodyValues.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </>
    );
}
