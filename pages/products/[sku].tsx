import React, { useState, useEffect } from "react";
import { prisma } from "lib/prisma";
import type { Product, ProductInstance, SaleTransaction } from "@prisma/client";
import Link from "next/link";
import clsx from "clsx";
import {
    Box,
    Button,
    Collapse,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { Edit as EditIcon } from "@mui/icons-material";
import { makeStyles } from "@mui/material/styles";
import dayjs from "dayjs";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { sku } = context.params;
    const product = await prisma.product.findUnique({
        where: {
            sku: sku as string,
        },
        include: {
            variations: true,
        },
    });

    // no Product page for variations, just simple or variable
    if (product.type === "VARIATION") {
        const productParent = await prisma.product.findUnique({
            where: {
                id: product.parentId,
            },
            include: {
                variations: true,
            },
        });

        if (productParent) {
            return {
                redirect: {
                    destination: `/products/${productParent.sku}`,
                    permanent: false,
                },
            };
        }
    }

    // Product Instances
    let productInstances: ProductInstance[] = [];

    if (product) {
        productInstances = await prisma.productInstance.findMany({
            where: {
                productId: {
                    in: [product.id, ...product.variations.map((variant) => variant.id)],
                },
            },
            include: {
                saleTransaction: true,
            },
        });
    }

    return {
        props: {
            product,
            productInstances,
        },
    };
};

const useStyles = makeStyles((theme) => ({
    collapseOpen: {
        "& > td.MuiTableCell-root.MuiTableCell-body": {
            borderBottom: "2px solid #dadada !important",
        },
    },
    variationHeaderCells: {
        "& > th": {
            backgroundColor: theme.palette.text.primary,
            color: "#fff",
        },
    },
    variationsSalesDataAvailable: {
        "& > td.MuiTableCell-root.MuiTableCell-body": {
            borderBottom: "2px double #000",
        },
        cursor: "pointer",
    },
}));

type ProductWithVariations = Product & { variations: Product[] };
type ProductInstanceWithSaleTransaction = ProductInstance & { saleTransaction: SaleTransaction };

const ProductPage = ({
    product,
    productInstances,
}: {
    product: ProductWithVariations;
    productInstances: ProductInstanceWithSaleTransaction[];
}) => {
    const classes = useStyles();

    const [productInstances, setProductInstances] = useState([]);
    const [allUnitsInStock, setAllUnitsInStock] = useState(0);
    const [allUnitsSold, setAllUnitsSold] = useState(0);
    const [totalCost, setTotalCost] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [profitUnitsSold, setProfitUnitsSold] = useState(0);

    const calculateUnitsInStock = (instances) => instances.filter((inst) => inst.Sale_Transaction_ID === null).length;
    const calculateUnitsSold = (instances) => instances.filter((inst) => inst.Sale_Transaction_ID !== null).length;
    const calculateUnitsInStockOfVariations = (vars, instances) => {
        const prods = vars.map((variant) => {
            return {
                ...variant,
                unitsInStock: instances.filter(
                    (inst) => inst.Product_ID === variant.Product_ID && inst.Sale_Transaction_ID === null
                ).length,
            };
        });
        console.log("units in stock of variations: ", prods);
        return [...prods];
    };

    const calculateUnitsSoldOfVariations = (vars, instances) => {
        const prods = vars.map((variant) => {
            return {
                ...variant,
                unitsSold: instances.filter(
                    (inst) => inst.Product_ID === variant.Product_ID && inst.Sale_Transaction_ID !== null
                ).length,
            };
        });
        return [...prods];
    };

    const calculateCost = (instances) => {
        let cost = 0;
        instances.forEach((inst) => {
            cost += inst.Invoice_Cost;
        });
        return cost;
    };

    const calculateRevenue = (instances) => {
        let revenue = 0;
        instances.forEach((inst) => {
            if (inst.Sale_Transaction_ID !== null) {
                revenue += inst.Final_Sale_Price;
            }
        });
        return revenue;
    };

    const calculateProfitOnUnitsSold = (instances) => {
        let cost = 0;
        let revenue = 0;
        instances.forEach((inst) => {
            if (inst.Sale_Transaction_ID !== null) {
                revenue += inst.Final_Sale_Price;
                cost += inst.Invoice_Cost;
            }
        });
        return revenue - cost;
    };

    const handleOpenVariantCollapse = (ind, unitsSold) => {
        if (unitsSold > 0) {
            let vars = product.variations.map((variant) => ({ ...variant, collapseOpen: false }));
            vars[ind].collapseOpen = !vars[ind].collapseOpen;
            setVariations(vars);
        }
    };

    return (
        <Grid container spacing={6} style={{ margin: 0, width: "100%", paddingBottom: "35px" }} justify='center'>
            <Grid item xs={12} sm={10}>
                <Paper>
                    <Grid container className='pt-12 pb-6'>
                        <Grid item xs={12}>
                            <Typography variant='h4' color='textPrimary' component='h1' align='center'>
                                {product.name}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant='h6' color='textSecondary' component='h2' align='center'>
                                {product.sku}
                            </Typography>
                        </Grid>
                    </Grid>
                    <Grid container spacing={3} style={{ padding: "20px" }}>
                        <Grid item xs={6} sm={2}>
                            <Typography variant='body1' component='p' align='right' color='textSecondary'>
                                Units in Stock:
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                            <Typography variant='body1' component='p'>
                                <strong>{allUnitsInStock}</strong>
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                            <Typography variant='body1' component='p' align='right' color='textSecondary'>
                                Total Cost:
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                            <Typography variant='body1' component='p'>
                                <strong>{`$${totalCost.toFixed(2)}`}</strong>
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                            <Typography variant='body1' component='p' align='right' color='textSecondary'>
                                Profit (Units Sold):
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                            <Typography variant='body1' component='p'>
                                <strong>{`$${profitUnitsSold.toFixed(2)}`}</strong>
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                            <Typography variant='body1' component='p' align='right' color='textSecondary'>
                                Units Sold:
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                            <Typography variant='body1' component='p'>
                                <strong>{allUnitsSold}</strong>
                            </Typography>
                        </Grid>

                        <Grid item xs={6} sm={2}>
                            <Typography variant='body1' component='p' align='right' color='textSecondary'>
                                Total Revenue:
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                            <Typography variant='body1' component='p'>
                                <strong>{`$${totalRevenue.toFixed(2)}`}</strong>
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                            <Typography variant='body1' component='p' align='right' color='textSecondary'>
                                Total Profit:
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                            <Typography variant='body1' component='p'>
                                <strong>{`$${(totalRevenue > totalCost ? totalRevenue - totalCost : 0).toFixed(
                                    2
                                )}`}</strong>
                            </Typography>
                        </Grid>
                    </Grid>

                    {product.variations.length > 0 && (
                        <React.Fragment>
                            <Grid item xs={12} className='pt-12 pb-6'>
                                <Typography variant='h5' component='h2' color='textSecondary' align='center'>
                                    Variations
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <TableContainer className='rounded-none' component={Paper}>
                                    <Table aria-label='variations-table' stickyHeader={true}>
                                        <TableHead>
                                            <TableRow className={classes.variationHeaderCells}>
                                                <TableCell component='th' width='10%'>
                                                    <strong>SKU</strong>
                                                </TableCell>
                                                <TableCell component='th' width='20%'>
                                                    <strong>Variation Name</strong>
                                                </TableCell>
                                                <TableCell component='th' align='center'>
                                                    <strong>Units In Stock</strong>
                                                </TableCell>
                                                <TableCell component='th' align='center'>
                                                    <strong>Cost</strong>
                                                </TableCell>
                                                <TableCell component='th' align='center'>
                                                    <strong>Units Sold</strong>
                                                </TableCell>
                                                <TableCell component='th' align='center'>
                                                    <strong>Profit</strong>
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {product.variations.map((variant, ind) => {
                                                return (
                                                    <React.Fragment key={variant.sku}>
                                                        <TableRow
                                                            onClick={() =>
                                                                handleOpenVariantCollapse(ind, variant.unitsSold)
                                                            }
                                                            className={clsx({
                                                                [classes.variationsSalesDataAvailable]:
                                                                    variant.unitsSold !== 0,
                                                                [classes.collapseOpen]: variant.collapseOpen,
                                                            })}
                                                        >
                                                            <TableCell>{variant.sku}</TableCell>
                                                            <TableCell>{`${product.name} - ${variant.variationName}`}</TableCell>
                                                            <TableCell align='center'>{variant.unitsInStock}</TableCell>
                                                            <TableCell align='center'>{`$${calculateCost(
                                                                productInstances.filter((inst) => {
                                                                    return inst.productId === variant.id;
                                                                })
                                                            ).toFixed(2)}`}</TableCell>
                                                            <TableCell align='center'>{variant.unitsSold}</TableCell>
                                                            <TableCell align='center'>{`$${calculateProfitOnUnitsSold(
                                                                productInstances.filter((inst) => {
                                                                    return inst.productId === variant.id;
                                                                })
                                                            ).toFixed(2)}`}</TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell style={{ padding: 0 }} colSpan={6}>
                                                                <Collapse
                                                                    in={variant.collapseOpen}
                                                                    timeout='auto'
                                                                    unmountOnExit
                                                                >
                                                                    <Box
                                                                        margin={1}
                                                                        className='bg-zinc-100 m-0 shadow-inner shadow-zinc-200'
                                                                        padding={2}
                                                                    >
                                                                        <Typography
                                                                            variant='h6'
                                                                            gutterBottom
                                                                            component='div'
                                                                        >
                                                                            Sales
                                                                        </Typography>
                                                                        <Table size='small' aria-label='purchases'>
                                                                            <TableHead>
                                                                                <TableRow>
                                                                                    <TableCell>
                                                                                        <strong>#</strong>
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <strong>Date</strong>
                                                                                    </TableCell>
                                                                                    <TableCell align='right'>
                                                                                        <strong>Sale Price</strong>
                                                                                    </TableCell>
                                                                                    <TableCell align='right'>
                                                                                        <strong>Notes</strong>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            </TableHead>
                                                                            <TableBody>
                                                                                {productInstances &&
                                                                                    productInstances
                                                                                        .filter(
                                                                                            (inst) =>
                                                                                                inst.productId ===
                                                                                                    variant.id &&
                                                                                                inst.saleTransactionId !==
                                                                                                    null
                                                                                        )
                                                                                        .map((inst, ind) => (
                                                                                            <TableRow key={inst.id}>
                                                                                                <TableCell
                                                                                                    component='th'
                                                                                                    scope='row'
                                                                                                >
                                                                                                    {ind + 1}
                                                                                                </TableCell>
                                                                                                <TableCell>
                                                                                                    {dayjs(
                                                                                                        inst
                                                                                                            .saleTransaction
                                                                                                            .dateTime
                                                                                                    ).format(
                                                                                                        "MMMM Do YYYY"
                                                                                                    )}
                                                                                                </TableCell>
                                                                                                <TableCell align='right'>
                                                                                                    {inst.finalSalePrice.toFixed(
                                                                                                        2
                                                                                                    )}
                                                                                                </TableCell>
                                                                                                <TableCell align='right'>
                                                                                                    {inst.notes}
                                                                                                </TableCell>
                                                                                            </TableRow>
                                                                                        ))}
                                                                            </TableBody>
                                                                        </Table>
                                                                    </Box>
                                                                </Collapse>
                                                            </TableCell>
                                                        </TableRow>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                        </React.Fragment>
                    )}
                    <Grid item xs={12}>
                        <Grid container justify='center'>
                            <Grid item xs={3}>
                                <Link href={`/products/edit/${product.sku}`} passHref>
                                    <Button variant='contained' color='primary' className='w-full flex my-6'>
                                        <EditIcon />
                                        Edit Product
                                    </Button>
                                </Link>
                            </Grid>
                        </Grid>
                    </Grid>
                </Paper>
            </Grid>
        </Grid>
    );
};

export default ProductPage;
