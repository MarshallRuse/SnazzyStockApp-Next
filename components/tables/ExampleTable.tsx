import { styled } from "@mui/material/styles";
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    tableCellClasses,
    TableContainer,
    TableHead,
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

export default function ExampleTable({ headerValues = [], bodyValues = [] }: ExampleTableProps) {
    return (
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
                    {bodyValues?.map((row, index) => (
                        <TableRow key={`ExampleTable-Body-Row${index}`}>
                            {row.map((bodyCell, ind) => (
                                <WrappingTooltip
                                    key={`ExampleTable-Body-Cell${ind}`}
                                    title={bodyCell.value.toString()}
                                    style={{ whiteSpace: "pre" }}
                                >
                                    <StyledTableCell>{bodyCell.value}</StyledTableCell>
                                </WrappingTooltip>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
