import { useState } from "react";
import { prisma } from "lib/prisma";
import type { Product, ProductInstance, SaleTransaction } from "@prisma/client";
import Link from "next/link";
import {
    Box,
    Button,
    Collapse,
    Paper,
    Table,
    TableBody,
    TableCell,
    tableCellClasses,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { Edit as EditIcon } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import dayjs from "dayjs";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { sku } = context.params;
    const product = await prisma.product.findUnique({
        where: {
            sku: sku as string,
        },
        include: {
            variations: {
                include: {
                    productInstances: {
                        include: {
                            saleTransaction: true,
                        },
                    },
                },
            },
            productInstances: {
                include: {
                    saleTransaction: true,
                },
            },
        },
    });

    // no Product page for variations, just simple or variable
    if (product.type === "VARIATION") {
        const productParent = await prisma.product.findUnique({
            where: {
                id: product.parentId,
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

    return {
        props: {
            product: JSON.parse(JSON.stringify(product)),
        },
    };
};

type VariationSaleTableCellProps = {
    variantsSold: boolean;
    collapseOpen: boolean;
};

const VariationSalesTableCell = styled(TableCell)<VariationSaleTableCellProps>(({ variantsSold, collapseOpen }) => ({
    [`&.${tableCellClasses.body}`]: {
        borderBottom: variantsSold ? (collapseOpen ? "2px solid #dadada !important" : "2px double #000") : "inherit",
    },
    cursor: variantsSold ? "pointer" : "inherit",
}));

const VariationHeaderCell = styled(TableCell)(({ theme }) => ({
    backgroundColor: theme.palette.text.primary,
    color: "#fff",
}));

type Variation = Product & {
    productInstances: (ProductInstance & {
        saleTransaction: SaleTransaction;
    })[];
};

type ProductWithVariationSales = Product & {
    variations: Variation[];
    productInstances: (ProductInstance & {
        saleTransaction: SaleTransaction;
    })[];
};

const ProductPage = ({ product }: { product: ProductWithVariationSales }) => {
    const [variantCollapseStatuses, setVariantCollapseStatuses] = useState<boolean[]>(
        product.variations?.map(() => false)
    );

    const calculateUnitsInStock = (variant: Variation | null = null): number => {
        if (variant !== null) {
            return variant.productInstances.filter((inst: ProductInstance) => inst.saleTransactionId === null).length;
        } else {
            return product.type === "SIMPLE"
                ? product.productInstances.filter((inst: ProductInstance) => inst.saleTransactionId === null).length
                : product.variations
                      .map(
                          (variant: Variation) =>
                              variant.productInstances.filter(
                                  (inst: ProductInstance) => inst.saleTransactionId === null
                              ).length
                      )
                      .reduce((acc, curr) => acc + curr, 0);
        }
    };

    const calculateUnitsSold = (variant: Variation | null = null): number => {
        if (variant !== null) {
            return variant.productInstances.filter((inst: ProductInstance) => inst.saleTransactionId !== null).length;
        } else {
            return product.type === "SIMPLE"
                ? product.productInstances.filter((inst: ProductInstance) => inst.saleTransactionId !== null).length
                : product.variations
                      .map(
                          (variant: Variation) =>
                              variant.productInstances.filter(
                                  (inst: ProductInstance) => inst.saleTransactionId !== null
                              ).length
                      )
                      .reduce((acc, curr) => acc + curr, 0);
        }
    };

    const calculateCost = (variant: Variation | null = null): number => {
        if (variant !== null) {
            return variant.productInstances.reduce(
                (acc: number, inst: ProductInstance) => acc + (inst.invoiceCost ?? 0),
                0
            );
        } else {
            return product.type === "SIMPLE"
                ? product.productInstances.reduce(
                      (acc: number, inst: ProductInstance) => acc + (inst.invoiceCost ?? 0),
                      0
                  )
                : product.variations
                      .map((variant: Variation) =>
                          variant.productInstances.reduce(
                              (acc: number, inst: ProductInstance) => acc + (inst.invoiceCost ?? 0),
                              0
                          )
                      )
                      .reduce((acc, curr) => acc + curr, 0);
        }
    };

    const calculateRevenue = (variant: Variation | null = null): number => {
        if (variant !== null) {
            return variant.productInstances.reduce(
                (acc: number, inst: ProductInstance) => acc + (inst.finalSalePrice ?? 0),
                0
            );
        } else {
            return product.type === "SIMPLE"
                ? product.productInstances.reduce(
                      (acc: number, inst: ProductInstance) => acc + (inst.finalSalePrice ?? 0),
                      0
                  )
                : product.variations
                      .map((variant: Variation) =>
                          variant.productInstances.reduce(
                              (acc: number, inst: ProductInstance) => acc + (inst.finalSalePrice ?? 0),
                              0
                          )
                      )
                      .reduce((acc, curr) => acc + curr, 0);
        }
    };

    const calculateProfitOnUnitsSold = (variant: Variation | null = null): number => {
        let cost = 0;
        let revenue = 0;
        if (variant !== null) {
            variant.productInstances.forEach((inst: ProductInstance) => {
                if (inst.saleTransactionId !== null) {
                    revenue += inst.finalSalePrice;
                    cost += inst.invoiceCost;
                }
            });

            return revenue - cost;
        } else {
            product.type === "SIMPLE"
                ? product.productInstances.forEach((inst: ProductInstance) => {
                      if (inst.saleTransactionId !== null) {
                          revenue += inst.finalSalePrice;
                          cost += inst.invoiceCost;
                      }
                  })
                : product.variations.forEach((variant: Variation) => {
                      variant.productInstances.forEach((inst: ProductInstance) => {
                          if (inst.saleTransactionId !== null) {
                              revenue += inst.finalSalePrice;
                              cost += inst.invoiceCost;
                          }
                      });
                  });

            return revenue - cost;
        }
    };

    const handleOpenVariantCollapse = (ind: number) => {
        const collapseStatusesCopy = [...variantCollapseStatuses];
        if (calculateUnitsSold(product.variations?.[ind]) > 0) {
            collapseStatusesCopy[ind] = !collapseStatusesCopy[ind];
            setVariantCollapseStatuses(collapseStatusesCopy);
        }
    };

    return (
        <div className='grid grid-cols-12 gap-6 m-0 w-full pb-9 justify-center'>
            <div className='col-span-12 sm:col-span-10'>
                <div className='grid grid-cols-12 pt-12 pb-6'>
                    <div className='col-span-12'>
                        <Typography variant='h4' color='textPrimary' component='h1' align='center'>
                            {product.name}
                        </Typography>
                    </div>
                    <div className='col-span-12'>
                        <Typography variant='h6' color='textSecondary' component='h2' align='center'>
                            {product.sku}
                        </Typography>
                    </div>
                </div>
                <div className='grid grid-cols-12 gap-3 p-5'>
                    <div className='grid-cols-6 sm:grid-cols-2'>
                        <Typography variant='body1' component='p' align='right' color='textSecondary'>
                            Units in Stock:
                        </Typography>
                    </div>
                    <div className='grid-cols-6 sm:grid-cols-2'>
                        <Typography variant='body1' component='p'>
                            <strong>{calculateUnitsInStock()}</strong>
                        </Typography>
                    </div>
                    <div className='grid-cols-6 sm:grid-cols-2'>
                        <Typography variant='body1' component='p' align='right' color='textSecondary'>
                            Total Cost:
                        </Typography>
                    </div>
                    <div className='grid-cols-6 sm:grid-cols-2'>
                        <Typography variant='body1' component='p'>
                            <strong>{`$${calculateCost().toFixed(2)}`}</strong>
                        </Typography>
                    </div>
                    <div className='grid-cols-6 sm:grid-cols-2'>
                        <Typography variant='body1' component='p' align='right' color='textSecondary'>
                            Profit (Units Sold):
                        </Typography>
                    </div>
                    <div className='grid-cols-6 sm:grid-cols-2'>
                        <Typography variant='body1' component='p'>
                            <strong>{`$${calculateProfitOnUnitsSold().toFixed(2)}`}</strong>
                        </Typography>
                    </div>
                    <div className='grid-cols-6 sm:grid-cols-2'>
                        <Typography variant='body1' component='p' align='right' color='textSecondary'>
                            Units Sold:
                        </Typography>
                    </div>
                    <div className='grid-cols-6 sm:grid-cols-2'>
                        <Typography variant='body1' component='p'>
                            <strong>{calculateUnitsSold()}</strong>
                        </Typography>
                    </div>

                    <div className='grid-cols-6 sm:grid-cols-2'>
                        <Typography variant='body1' component='p' align='right' color='textSecondary'>
                            Total Revenue:
                        </Typography>
                    </div>
                    <div className='grid-cols-6 sm:grid-cols-2'>
                        <Typography variant='body1' component='p'>
                            <strong>{`$${calculateRevenue().toFixed(2)}`}</strong>
                        </Typography>
                    </div>
                    <div className='grid-cols-6 sm:grid-cols-2'>
                        <Typography variant='body1' component='p' align='right' color='textSecondary'>
                            Total Profit:
                        </Typography>
                    </div>
                    <div className='grid-cols-6 sm:grid-cols-2'>
                        <Typography variant='body1' component='p'>
                            <strong>{`$${(calculateRevenue() > calculateCost()
                                ? calculateRevenue() - calculateCost()
                                : 0
                            ).toFixed(2)}`}</strong>
                        </Typography>
                    </div>
                </div>

                {product.variations.length > 0 && (
                    <>
                        <div className='col-span-12 pt-12 pb-6'>
                            <Typography variant='h5' component='h2' color='textSecondary' align='center'>
                                Variations
                            </Typography>
                        </div>
                        <div className='col-span-12'>
                            <TableContainer className='rounded-none' component={Paper}>
                                <Table aria-label='variations-table' stickyHeader={true}>
                                    <TableHead>
                                        <TableRow>
                                            <VariationHeaderCell component='th' width='10%'>
                                                <strong>SKU</strong>
                                            </VariationHeaderCell>
                                            <VariationHeaderCell component='th' width='20%'>
                                                <strong>Variation Name</strong>
                                            </VariationHeaderCell>
                                            <VariationHeaderCell component='th' align='center'>
                                                <strong>Units In Stock</strong>
                                            </VariationHeaderCell>
                                            <VariationHeaderCell component='th' align='center'>
                                                <strong>Cost</strong>
                                            </VariationHeaderCell>
                                            <VariationHeaderCell component='th' align='center'>
                                                <strong>Units Sold</strong>
                                            </VariationHeaderCell>
                                            <VariationHeaderCell component='th' align='center'>
                                                <strong>Profit</strong>
                                            </VariationHeaderCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {product.variations.map((variant, ind) => {
                                            const unitsSold = calculateUnitsSold(variant);
                                            const collapseOpen = variantCollapseStatuses[ind];

                                            return (
                                                <div key={variant.sku}>
                                                    <TableRow onClick={() => handleOpenVariantCollapse(ind)}>
                                                        <VariationSalesTableCell
                                                            variantsSold={unitsSold > 0}
                                                            collapseOpen={collapseOpen}
                                                        >
                                                            {variant.sku}
                                                        </VariationSalesTableCell>
                                                        <VariationSalesTableCell
                                                            variantsSold={unitsSold > 0}
                                                            collapseOpen={collapseOpen}
                                                        >{`${product.name} - ${variant.variationName}`}</VariationSalesTableCell>
                                                        <VariationSalesTableCell
                                                            variantsSold={unitsSold > 0}
                                                            collapseOpen={collapseOpen}
                                                            align='center'
                                                        >
                                                            {calculateUnitsInStock(variant)}
                                                        </VariationSalesTableCell>
                                                        <VariationSalesTableCell
                                                            variantsSold={unitsSold > 0}
                                                            collapseOpen={collapseOpen}
                                                            align='center'
                                                        >{`$${calculateCost(variant).toFixed(
                                                            2
                                                        )}`}</VariationSalesTableCell>
                                                        <VariationSalesTableCell
                                                            variantsSold={unitsSold > 0}
                                                            collapseOpen={collapseOpen}
                                                            align='center'
                                                        >
                                                            {calculateUnitsSold(variant)}
                                                        </VariationSalesTableCell>
                                                        <VariationSalesTableCell
                                                            variantsSold={unitsSold > 0}
                                                            collapseOpen={collapseOpen}
                                                            align='center'
                                                        >{`$${calculateProfitOnUnitsSold(variant).toFixed(
                                                            2
                                                        )}`}</VariationSalesTableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell style={{ padding: 0 }} colSpan={6}>
                                                            <Collapse
                                                                in={variantCollapseStatuses[ind]}
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
                                                                            {variant.productInstances &&
                                                                                variant.productInstances
                                                                                    .filter(
                                                                                        (inst: ProductInstance) =>
                                                                                            inst.saleTransactionId !==
                                                                                            null
                                                                                    )
                                                                                    .map(
                                                                                        (
                                                                                            inst: ProductInstance & {
                                                                                                saleTransaction: SaleTransaction;
                                                                                            },
                                                                                            ind
                                                                                        ) => (
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
                                                                                        )
                                                                                    )}
                                                                        </TableBody>
                                                                    </Table>
                                                                </Box>
                                                            </Collapse>
                                                        </TableCell>
                                                    </TableRow>
                                                </div>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </div>
                    </>
                )}
                <div className='col-span-12'>
                    <div className='flex justify-center'>
                        <Link href={`/products/edit/${product.sku}`} passHref>
                            <Button variant='outlined' color='primary' className='min-w-12 flex my-6'>
                                <EditIcon fontSize='small' className='mr-2' />
                                Edit Product
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductPage;
