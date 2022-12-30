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
import type { UpdateSaleTransactionWithProductInstances } from "lib/interfaces/UpdateSaleTransactionWithProductInstances";
import { ProductWithInstanceStockData } from "lib/interfaces/ProductWithInstanceStockData";
import Image from "next/image";
import CTAButton from "./CTAButton";
import toast from "react-hot-toast";

type CartContentsProps = {
    actionButtons: boolean;
    fullHeightTable: boolean;
    cartIndex: number;
    saleTransactionId: string;
    flagDialogClosed: () => void;
    refreshSaleTransactions: () => void;
    contents: ProductWithInstanceStockData[];
    products: ProductWithInstanceStockData[];
    productToBeAdded: ProductWithInstanceStockData | null;
    removeCart: (i: number) => void;
};

const CartContents = ({
    actionButtons,
    cartIndex,
    saleTransactionId,
    flagDialogClosed,
    refreshSaleTransactions,
    contents,
    productToBeAdded,
    products,
    removeCart,
}: CartContentsProps) => {
    const [openAddEditProductDialog, setOpenAddEditProductDialog] = useState(false);
    const [cartItemToEdit, setCartItemToEdit] = useState<ProductWithInstanceStockData | null>(null);
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

    const handleAddToCartButtonClick = () => {
        setAddOrEditCartItem("add");
        setOpenAddEditProductDialog(true);
    };

    const handleCartRowClick = (prod: ProductWithInstanceStockData) => {
        // on CartRowClick, pass generic product of same type to
        // AddEditCartProducts so it has the full range of productInstances for quantity
        // adjustment.  The product as passed into this function only has the list of
        // productInstances for this saleTransaction
        const sameProductsAsSelected = products.find((p) => p.id === prod.id);
        setCartItemToEdit(sameProductsAsSelected);
        setAddOrEditCartItem("edit");
        setOpenAddEditProductDialog(true);
    };

    const handleAddEditCartDialogClosed = () => {
        setCartItemToEdit(null);
        flagDialogClosed();
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
                cartRow.productInstances
                    .filter((inst) => inst.saleTransactionId === saleTransactionId)
                    .map((inst) => inst.id)
                    .map((id) => ({
                        id,
                        discount: 0,
                        discountType: null,
                        finalSalePrice: cartRow.targetPrice,
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
                              accumulator +
                              currentVal.targetPrice *
                                  currentVal.productInstances.filter(
                                      (inst) => inst.saleTransactionId === saleTransactionId
                                  ).length,
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

        const toastId = toast.loading("Completing sale...");
        const result = await fetch(`/api/sale_transactions/${saleTransactionId}`, {
            method: "PATCH",
            mode: "cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ completedSaleTransaction }),
        });
        if (result.status === 204) {
            toast.success("Sale completed!", { id: toastId });
            handleCloseCompleteDialog();
            refreshSaleTransactions();
            removeCart(cartIndex);
        } else {
            toast.error("Unable to complete sale", { id: toastId });
        }
    };

    const handleCancelCart = async () => {
        const toastId = toast.loading("Cancelling sale transaction...", { position: "top-right" });
        const saleTransactionResult = await fetch(`/api/sale_transactions/${saleTransactionId}`, {
            method: "DELETE",
            mode: "cors",
        });

        if (saleTransactionResult.status === 204) {
            refreshSaleTransactions();
            removeCart(cartIndex);
            toast.success("Sale transaction cancelled 😢", { id: toastId, position: "top-right" });
        } else {
            toast.error("Unable to cancel sale transaction", { id: toastId, position: "top-right" });
        }
    };

    useEffect(() => {
        let newTotal = contents.reduce(
            (accumulator, currentVal) =>
                accumulator +
                currentVal.targetPrice *
                    currentVal.productInstances.filter((inst) => inst.saleTransactionId === saleTransactionId).length,
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

    useEffect(() => {
        if (productToBeAdded !== null) {
            setCartItemToEdit(productToBeAdded);
            setAddOrEditCartItem("add");
            setOpenAddEditProductDialog(true);
        }
    }, [productToBeAdded]);

    return (
        <>
            <div className='overflow-y-auto flex flex-col flex-grow subtleScrollbar'>
                <div className={`flex flex-col gap-2 p-4 ${contents.length === 0 ? "h-full" : ""}`}>
                    {contents.length > 0 ? (
                        contents.map((product) => {
                            const quantity = product.productInstances.filter(
                                (inst) => inst.saleTransactionId === saleTransactionId
                            ).length;
                            return (
                                <div
                                    key={product.id}
                                    className='col-span-12 grid grid-cols-12 gap-2 p-2 cursor-pointer rounded-md transition hover:bg-zinc-100'
                                    onClick={() => handleCartRowClick(product)}
                                >
                                    <div className='col-span-3'>
                                        <Image
                                            width={75}
                                            height={75}
                                            src={
                                                product.image
                                                    ? product.image
                                                    : "/images/products/SnazzyStonesPlaceholder.png"
                                            }
                                            className='w-full rounded-md'
                                            alt={`Thumbnail sized image for ${product.name}${
                                                product.type === "VARIATION" ? ` - ${product.variationName}` : ""
                                            }`}
                                        />
                                    </div>
                                    <div className='col-span-9 grid grid-cols-12'>
                                        <div className='col-span-12'>
                                            {`${product.name}${
                                                product.type === "VARIATION" ? ` - ${product.variationName}` : ""
                                            }`}
                                            <br />
                                            <span className='text-sm text-bluegreen-500'>{product.sku}</span>
                                        </div>
                                        <div className='col-span-6 text-blueyonder-500 font-semibold'>
                                            {new Intl.NumberFormat("en-CA", {
                                                style: "currency",
                                                currency: "CAD",
                                            }).format(product.targetPrice * quantity)}
                                        </div>
                                        <div className='col-span-6 text-right'>
                                            <span className='text-blueyonder-500 text-sm'>
                                                {new Intl.NumberFormat("en-CA", {
                                                    style: "currency",
                                                    currency: "CAD",
                                                }).format(product.targetPrice)}
                                            </span>
                                            <span className='font-semibold text-zinc-500'> x {quantity}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className='h-full flex justify-center items-center'>No products in cart</div>
                    )}
                </div>
            </div>
            <div className='flex justify-center'>
                <CTAButton heavyRounding onClick={handleAddToCartButtonClick}>
                    Add To Cart
                </CTAButton>
            </div>
            <div className='grid grid-cols-2 gap-y-2 m-4 mb-0 p-2 bg-slate-100 border-t border-dashed border-zinc-500'>
                <div>Subtotal:</div>
                <div className='text-right text-blueyonder-500'>
                    {new Intl.NumberFormat("en-CA", {
                        style: "currency",
                        currency: "CAD",
                    }).format(
                        contents.reduce(
                            (acc, curr) =>
                                acc +
                                curr.targetPrice *
                                    curr.productInstances.filter((inst) => inst.saleTransactionId === saleTransactionId)
                                        .length,
                            0
                        )
                    )}
                </div>
                <div>Discount:</div>
                <div className='text-right text-blueyonder-500'>
                    {new Intl.NumberFormat("en-CA", {
                        style: "currency",
                        currency: "CAD",
                    }).format(0)}
                </div>
            </div>
            <div className='grid grid-cols-2 gap-y-2 m-4 mt-0 p-2 bg-slate-100 border-t-2 border-dashed border-zinc-500'>
                <div>Total:</div>
                <div className='text-right text-blueyonder-500 font-semibold'>
                    {new Intl.NumberFormat("en-CA", {
                        style: "currency",
                        currency: "CAD",
                    }).format(
                        contents.reduce(
                            (acc, curr) =>
                                acc +
                                curr.targetPrice *
                                    curr.productInstances.filter((inst) => inst.saleTransactionId === saleTransactionId)
                                        .length,
                            0
                        ) - 0
                    )}
                </div>
            </div>
            {actionButtons && (
                <div className='col-span-12 justify-self-end'>
                    <div className='flex flex-row-reverse flex-nowrap justify-between py-4 px-1 md:flex-col md:gap-6 md:h-full md:justify-around md:py-0 md:px-5'>
                        <div className='md:hidden'>
                            <Button variant='outlined' onClick={handleOpenAddProductDialog}>
                                <AddIcon fontSize='small' className='mr-2' />
                                <span className='hidden sm:inline'>Add Product</span>
                            </Button>
                        </div>
                        <div className='flex justify-between gap-2'>
                            <Button variant='outlined' color='secondary' onClick={handleCancelCart}>
                                <CancelIcon fontSize='small' className='mr-2' />
                                <span className='hidden sm:inline'>Cancel</span>
                            </Button>
                            <Button variant='outlined' color='primary' onClick={handleCompleteCart}>
                                <CheckIcon fontSize='small' className='mr-2' />
                                <span className='hidden sm:inline'>Complete</span>
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <AddEditCartProduct
                open={openAddEditProductDialog}
                close={handleCloseAddProductDialog}
                mode={addOrEditCartItem}
                saleTransactionId={saleTransactionId}
                initialProduct={cartItemToEdit}
                products={products}
                flagDialogClosed={handleAddEditCartDialogClosed}
                refreshSaleTransactions={refreshSaleTransactions}
            />

            <Dialog
                open={completeDialogOpen}
                onClose={handleCloseCompleteDialog}
                aria-labelledby='complete-transaction-dialog-title'
            >
                <DialogTitle id='complete-transaction-dialog-title'>Complete Sale Transaction</DialogTitle>
                <DialogContent>
                    <div className='my-3 mx-0'>Are you sure you would like to complete the transaction?</div>
                    <div className='grid grid-cols-2 gap-y-4 my-4 mb-0 p-4 bg-slate-100'>
                        <div>Subtotal:</div>
                        <div className='text-right text-blueyonder-500'>
                            {new Intl.NumberFormat("en-CA", {
                                style: "currency",
                                currency: "CAD",
                            }).format(
                                contents.reduce(
                                    (acc, curr) =>
                                        acc +
                                        curr.targetPrice *
                                            curr.productInstances.filter(
                                                (inst) => inst.saleTransactionId === saleTransactionId
                                            ).length,
                                    0
                                )
                            )}
                        </div>
                        <div>Discount:</div>
                        <div className='text-right text-blueyonder-500'>
                            {new Intl.NumberFormat("en-CA", {
                                style: "currency",
                                currency: "CAD",
                            }).format(0)}
                        </div>
                    </div>
                    <div className='grid grid-cols-2 gap-y-2 mb-4 mt-0 p-4 bg-slate-100 border-t-2 border-dashed border-zinc-500'>
                        <div>Total:</div>
                        <div className='text-right text-blueyonder-500 font-semibold'>
                            {new Intl.NumberFormat("en-CA", {
                                style: "currency",
                                currency: "CAD",
                            }).format(
                                contents.reduce(
                                    (acc, curr) =>
                                        acc +
                                        curr.targetPrice *
                                            curr.productInstances.filter(
                                                (inst) => inst.saleTransactionId === saleTransactionId
                                            ).length,
                                    0
                                ) - 0
                            )}
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
                    <Button onClick={handleCloseCompleteDialog} variant='outlined' color='secondary'>
                        <CancelIcon fontSize='small' className='mr-2' />
                        Cancel
                    </Button>
                    <CTAButton onClick={completeSaleTransaction} heavyRounding={false} size='medium' color='primary'>
                        <CheckIcon fontSize='small' className='mr-2' />
                        Complete
                    </CTAButton>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default CartContents;
