import { useState, useEffect } from "react";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    Radio,
    RadioGroup,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";

import {
    Add as AddIcon,
    Done as CheckIcon,
    ExpandMore as ExpandMoreIcon,
    Clear as CancelIcon,
} from "@mui/icons-material";

import AddEditCartProduct from "./AddEditCartProducts";
import type { IGroupedCartItem } from "lib/interfaces/IGroupedCartItem";
import type { UpdateSaleTransactionWithProductInstances } from "lib/interfaces/UpdateSaleTransactionWithProductInstances";
import { ProductWithInstanceStockData } from "lib/interfaces/ProductWithInstanceStockData";

type CartContentsProps = {
    salesPersonId: string;
    sourceId: string;
    actionButtons: boolean;
    fullHeightTable: boolean;
    cartIndex: number;
    saleTransactionId: string;
    refreshSaleTransactions: () => void;
    contents: IGroupedCartItem[];
    products: ProductWithInstanceStockData[];
    removeCart: (i: number) => void;
};

const CartContents = ({
    salesPersonId,
    sourceId,
    actionButtons,
    fullHeightTable,
    cartIndex,
    saleTransactionId,
    refreshSaleTransactions,
    contents,
    products,
    removeCart,
}: CartContentsProps) => {
    const [openAddEditProductDialog, setOpenAddEditProductDialog] = useState(false);
    const [cartItemToEdit, setCartItemToEdit] = useState(undefined);
    const [addOrEditCartItem, setAddOrEditCartItem] = useState<"add" | "edit">("add");
    const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [discountType, setDiscountType] = useState<"amount" | "percent">("amount");
    const [total, setTotal] = useState(0);

    const handleOpenAddProductDialog = () => {
        setAddOrEditCartItem("add");
        setOpenAddEditProductDialog(true);
    };
    const handleCloseAddProductDialog = () => setOpenAddEditProductDialog(false);
    const handleCartRowClick = (prod) => {
        setCartItemToEdit(prod);
        setAddOrEditCartItem("edit");
        setOpenAddEditProductDialog(true);
        console.log("prod: ", prod);
    };

    const handleDiscountChange = (e) =>
        e.target.value !== "" ? setDiscount(parseFloat(e.target.value)) : setDiscount(0);
    const handleDiscountTypeChange = (e) => setDiscountType(e.target.value);
    const handleCompleteCart = () => {
        setCompleteDialogOpen(true);
    };

    const handleCloseCompleteDialog = () => {
        setDiscount(0);
        setDiscountType("amount");
        setCompleteDialogOpen(false);
    };

    const completeSaleTransaction = async () => {
        const productInstances = contents
            .map((cartRow) =>
                cartRow.instanceIds.map((id) => ({
                    id,
                    discount: 0,
                    discountType: null,
                    finalSalePrice: cartRow.typicalPrice,
                }))
            )
            .flat();

        let completedSaleTransaction: UpdateSaleTransactionWithProductInstances = {
            status: "COMPLETE",
            customerId: "UnknownCustomer",
            productInstances,
        };
        if (discount > 0) {
            // Apply discount evenly to all items in cart
            // TODO: Give the option of applying discount to all cart items OR to selected items (UI started below)

            // Get the discount value in dollar amount
            const discountValue =
                discountType === "amount"
                    ? discount
                    : contents.reduce(
                          (accumulator, currentVal) =>
                              accumulator + currentVal.typicalPrice * currentVal.instanceIds.length,
                          0
                      ) *
                      (discount / 100);

            // Get the number of items that will be discounted
            const numItemsToApplyDiscountTo = productInstances.length;
            const evenDiscount = parseFloat((discountValue / numItemsToApplyDiscountTo).toFixed(2));

            productInstances.forEach((inst) => {
                inst.finalSalePrice -= evenDiscount;
                inst.discount = evenDiscount;
                inst.discountType = "CART";
            });
        } else {
            productInstances.forEach((inst) => {
                inst.discount = 0;
                inst.discountType = null;
            });
        }

        const result = await fetch(`/api/sale_transactions/${saleTransactionId}`, {
            method: "PATCH",
            mode: "cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ completedSaleTransaction }),
        });
        if (result.status === 200) {
            handleCloseCompleteDialog();
            refreshSaleTransactions();
            removeCart(cartIndex);
        }
    };

    const handleCancelCart = async () => {
        const saleTransactionResult = await fetch(`/api/sale_transactions/${saleTransactionId}`, {
            method: "DELETE",
            mode: "cors",
        });

        if (saleTransactionResult.status === 204) {
            refreshSaleTransactions();
            removeCart(cartIndex);
        }
    };

    useEffect(() => {
        let newTotal = contents.reduce(
            (accumulator, currentVal) => accumulator + currentVal.typicalPrice * currentVal.instanceIds.length,
            0
        );
        if (discount > 0) {
            if (discountType === "amount") {
                newTotal = newTotal - discount;
            } else if (discountType === "percent") {
                newTotal = newTotal - newTotal * (discount / 100);
            }
        }
        setTotal(newTotal);
    }, [contents, discount, discountType]);

    return (
        <>
            <div className='grid grid-cols-12 md:min-h-[80vh]'>
                <div
                    className={`${
                        actionButtons ? "col-span-9" : "col-span-12"
                    } flex flex-col justify-between md:border-r md:border-zinc-200`}
                >
                    <TableContainer className={fullHeightTable ? "max-h-[50vh] min-h-[50vh]" : ""}>
                        <Table sx={{ minWidth: 650 }} aria-label='simple table' stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell className='text-base text-left'>SKU</TableCell>
                                    <TableCell className='text-base text-left'>Name</TableCell>
                                    <TableCell className='text-base text-right'>Price</TableCell>
                                    <TableCell className='text-base text-right'>Qty.</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {contents?.map((prod) => (
                                    <TableRow
                                        key={prod.sku}
                                        hover
                                        sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                                        onClick={() => handleCartRowClick(prod)}
                                    >
                                        <TableCell align='left'>{prod.sku}</TableCell>
                                        <TableCell align='left'>{prod.productName}</TableCell>
                                        <TableCell align='right'>{`$${prod.typicalPrice.toFixed(2)}`}</TableCell>
                                        <TableCell align='right'>{prod.instanceIds.length}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TableContainer className='shadow-light flex-grow-0 rounded-bl-md'>
                        <Table size='small' className='bg-blueyonder-500'>
                            <TableBody>
                                <TableRow>
                                    <TableCell align='right' colSpan={4} className='font-semibold text-base text-white'>
                                        Total Price:
                                    </TableCell>
                                    <TableCell align='right' className='text-white'>
                                        <strong>{`$${contents
                                            ?.reduce(
                                                (accumulator, currentVal) =>
                                                    accumulator +
                                                    currentVal.typicalPrice * currentVal.instanceIds.length,
                                                0
                                            )
                                            .toFixed(2)}`}</strong>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell align='right' colSpan={4} className='font-semibold text-base text-white'>
                                        Total Qty.:
                                    </TableCell>
                                    <TableCell align='right' className='text-white'>
                                        <strong>
                                            {contents?.reduce(
                                                (accumulator, currentVal) =>
                                                    accumulator + currentVal.instanceIds.length,
                                                0
                                            )}
                                        </strong>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div>
                {actionButtons && (
                    <div className='col-span-12 md:col-span-3'>
                        <div className='flex flex-row-reverse flex-nowrap justify-between py-4 px-1 md:flex-col md:gap-6 md:h-full md:justify-around md:py-0 md:px-5'>
                            <Button variant='outlined' className='order-1' onClick={handleOpenAddProductDialog}>
                                <AddIcon />
                                <span className='hidden sm:inline'>Add Product</span>
                            </Button>
                            <Button variant='outlined' color='secondary' className='order-3' onClick={handleCancelCart}>
                                <CancelIcon />
                                <span className='hidden sm:inline'>Cancel</span>
                            </Button>
                            <Button variant='outlined' color='primary' className='order-2' onClick={handleCompleteCart}>
                                <CheckIcon />
                                <span className='hidden sm:inline'>Complete</span>
                            </Button>
                        </div>
                    </div>
                )}

                <AddEditCartProduct
                    open={openAddEditProductDialog}
                    close={handleCloseAddProductDialog}
                    saleTransactionId={saleTransactionId}
                    refreshSaleTransactions={refreshSaleTransactions}
                    mode={addOrEditCartItem}
                    cartItemToEdit={cartItemToEdit}
                    products={products}
                />
            </div>
            <Dialog
                open={completeDialogOpen}
                onClose={handleCloseCompleteDialog}
                aria-labelledby='complete-transaction-dialog-title'
            >
                <DialogTitle id='complete-transaction-dialog-title'>Complete the Sale Transaction?</DialogTitle>
                <DialogContent>
                    <div className='grid grid-cols-12'>
                        <div className='col-span-12 my-3 mx-0'>
                            <Typography variant='body1' className='text-zinc-500'>
                                Complete the transaction?
                            </Typography>
                        </div>
                        <div className='col-span-8 my-3 mx-0'>
                            <Typography variant='body1' align='right' className='text-zinc-500'>
                                Total Products Price:
                            </Typography>
                        </div>
                        <div className='col-span-4 my-3 mx-0'>
                            <Typography variant='body1' align='right' className='text-zinc-500'>
                                <strong>{`$${contents
                                    ?.reduce(
                                        (accumulator, currentVal) =>
                                            accumulator + currentVal.typicalPrice * currentVal.instanceIds.length,
                                        0
                                    )
                                    .toFixed(2)}`}</strong>
                            </Typography>
                        </div>
                        <div className='col-span-8 my-3 mx-0'>
                            <Typography variant='body1' align='right' className='text-zinc-500'>
                                Total Quantity:
                            </Typography>
                        </div>
                        <div className='col-span-4 my-3 mx-0'>
                            <Typography variant='body1' align='right' className='text-zinc-500'>
                                <strong>
                                    {contents?.reduce(
                                        (accumulator, currentVal) => accumulator + currentVal.instanceIds.length,
                                        0
                                    )}
                                </strong>
                            </Typography>
                        </div>
                        {discount > 0 && (
                            <>
                                <div className='col-span-8 my-3 mx-0'>
                                    <Typography variant='body1' align='right' className='text-zinc-500'>
                                        Discount:
                                    </Typography>
                                </div>
                                <div className='col-span-4 my-3 mx-0'>
                                    <Typography variant='body1' align='right' className='text-zinc-500'>
                                        -
                                        <strong>
                                            {discountType === "amount"
                                                ? `$${discount.toFixed(2)}`
                                                : `${discount.toFixed(1)}%`}
                                        </strong>
                                    </Typography>
                                </div>
                            </>
                        )}
                        <hr />
                        <div className='col-span-8 my-3 mx-0'>
                            <Typography variant='body1' align='right'>
                                Total:
                            </Typography>
                        </div>
                        <div className='col-span-4 my-3 mx-0'>
                            <Typography variant='body1' align='right'>
                                <strong>{`$${total.toFixed(2)}`}</strong>
                            </Typography>
                        </div>
                    </div>

                    <Accordion className='shadow-none mb-0 mt-6'>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls='discount-content'
                            id='discount-header'
                        >
                            Apply a discount?
                        </AccordionSummary>
                        <AccordionDetails>
                            <div className='grid grid-cols-12 justify-center items-center gap-4'>
                                <div className='col-span-12 sm:col-span-6'>
                                    <TextField
                                        margin='dense'
                                        id='discount-amount'
                                        label='Discount Amount'
                                        variant='outlined'
                                        fullWidth
                                        type='number'
                                        value={discount}
                                        onChange={handleDiscountChange}
                                    />
                                </div>
                                <div className='grid-cols-12 sm:grid-cols-4 my-3 mx-0'>
                                    <FormControl component='fieldset'>
                                        <RadioGroup
                                            row
                                            aria-label='discount-type'
                                            name='discount-type'
                                            value={discountType}
                                            onChange={handleDiscountTypeChange}
                                        >
                                            <div className='grid grid-cols-12'>
                                                <div className='col-span-12'>
                                                    <FormControlLabel
                                                        value='amount'
                                                        control={<Radio color='primary' />}
                                                        label='Amount ($)'
                                                        labelPlacement='end'
                                                    />
                                                </div>
                                                <div className='col-span-12'>
                                                    <FormControlLabel
                                                        value='percent'
                                                        control={<Radio color='primary' />}
                                                        label='Percent (%)'
                                                        labelPlacement='end'
                                                    />
                                                </div>
                                            </div>
                                        </RadioGroup>
                                    </FormControl>
                                </div>
                            </div>
                        </AccordionDetails>
                    </Accordion>
                </DialogContent>
                <DialogActions className='flex justify-between p-6'>
                    <Button onClick={handleCloseCompleteDialog} variant='outlined'>
                        Cancel
                    </Button>
                    <Button onClick={completeSaleTransaction} color='secondary' variant='contained'>
                        Complete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default CartContents;
