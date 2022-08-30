import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Add from "@mui/icons-material/Add";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Remove from "@mui/icons-material/Remove";

import BarcodeScanIcon from "./BarcodeScanIcon";
import ProductAutocomplete from "./forms/inputs/ProductAutocomplete";
import Scanner from "./Scanner";
import type { ProductWithInstanceStockData } from "lib/interfaces/ProductWithInstanceStockData";
import CTAButton from "./CTAButton";
import toast from "react-hot-toast";

const StyledTextbox = styled(TextField)({
    "& .MuiOutlinedInput-root": {
        borderRadius: 0,
    },
    "& input": {
        fontSize: "1.5em",
        padding: "12px",
        textAlign: "center",
    },
});

const CenteredAccordion = styled(Accordion)({
    boxShadow: "none",
    marginBottom: 0,
    "& .MuiAccordionSummary-content": {
        flexGrow: 0,
    },
});

type AddEditCartProductProps = {
    open: boolean;
    close: () => void;
    mode: "add" | "edit";
    saleTransactionId: string;
    initialProduct: ProductWithInstanceStockData | null;
    products: ProductWithInstanceStockData[];
    flagDialogClosed: () => void;
    refreshSaleTransactions: () => void;
};

const AddEditCartProduct = ({
    open,
    close,
    mode,
    saleTransactionId,
    initialProduct,
    products = [],
    flagDialogClosed,
    refreshSaleTransactions,
}: AddEditCartProductProps) => {
    const dialogRef = useRef(null);
    const scannerButtonRef = useRef(null);

    const [selectedProduct, setSelectedProduct] = useState<ProductWithInstanceStockData | null>(null);
    const [scannerOn, setScannerOn] = useState(false);
    const [maxQuantity, setMaxQuantity] = useState(0);
    const [addProductQuantity, setAddProductQuantity] = useState(1);
    const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);

    const handleIncrementProductQuantity = () => setAddProductQuantity(Math.min(addProductQuantity + 1, maxQuantity));
    const handleDecrementProductQuantity = () => setAddProductQuantity(Math.max(addProductQuantity - 1, 1));
    const handleProductSearchSelection = (newValue: ProductWithInstanceStockData | null) => {
        setSelectedProduct(newValue);
        newValue !== null
            ? setMaxQuantity(newValue.productInstances.filter((inst) => inst.saleTransactionId !== null).length)
            : setMaxQuantity(0);
        setAddProductQuantity(1);
    };

    const handleScannerButtonClick = () => {
        //scannerRef.current.scrollIntoView();
        // window.scrollTo(0, scannerRef.current.getBoundingClientRect().top);

        // console.log("ref top: ", scannerRef.current.getBoundingClientRect().top)

        const topPos = scannerButtonRef.current.offsetTop;

        // This wont work as intended because the div scrolls before its fully resized
        // and ends up running out of space.
        // Need to use ueeCallback with a ref,
        // TODO: implement as seen here: https://medium.com/@teh_builder/ref-objects-inside-useeffect-hooks-eb7c15198780
        if (!scannerOn) {
            dialogRef.current.scrollBy({ top: topPos * 3, behaviour: "smooth" });
        }

        setScannerOn((prevScannerOn) => !prevScannerOn);
    };

    const handleCloseMainDialog = () => {
        setSelectedProduct(null);
        setMaxQuantity(undefined);
        setAddProductQuantity(1);
        setScannerOn(false);
        flagDialogClosed();
        close();
    };

    const handleAddProductToCart = async () => {
        const productInstanceUpdates = selectedProduct.productInstances
            .filter((inst) => inst.saleTransactionId === null)
            .slice(0, addProductQuantity)
            .map((inst) => ({
                id: inst.id,
                saleTransactionId: saleTransactionId,
            }));

        const toastId = toast.loading(
            `Adding ${selectedProduct.name}${
                selectedProduct.type === "VARIATION" && selectedProduct.variationName
                    ? ` - ${selectedProduct.variationName}`
                    : ""
            } to cart...`,
            { position: "top-right" }
        );
        const result = await fetch("/api/product_instances", {
            method: "PATCH",
            mode: "cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ instances: productInstanceUpdates }),
        });

        if (result.status === 200) {
            refreshSaleTransactions();
            handleCloseMainDialog();
            toast.success(
                `${selectedProduct.name}${
                    selectedProduct.type === "VARIATION" && selectedProduct.variationName
                        ? ` - ${selectedProduct.variationName}`
                        : ""
                } added!`,
                { id: toastId, position: "top-right" }
            );
        } else {
            toast.error(
                `Unable to add ${selectedProduct.name}${
                    selectedProduct.type === "VARIATION" && selectedProduct.variationName
                        ? ` - ${selectedProduct.variationName}`
                        : ""
                }`,
                { id: toastId, position: "top-right" }
            );
        }
    };

    const handleEditProductInCart = async () => {
        // if larger quantity after edit, add more instance IDs
        const thisSalesProductsInstances = selectedProduct.productInstances.filter(
            (inst) => inst.saleTransactionId === saleTransactionId
        );

        const toastId = toast.loading(
            `Editing ${selectedProduct.name}${
                selectedProduct.type === "VARIATION" && selectedProduct.variationName
                    ? ` - ${selectedProduct.variationName}`
                    : ""
            } in cart...`,
            { position: "top-right" }
        );

        if (addProductQuantity > thisSalesProductsInstances.length) {
            // get the difference
            const numAddedInstIDs = addProductQuantity - thisSalesProductsInstances.length;
            const productInstanceUpdates = products
                .find((prod) => prod.sku === selectedProduct.sku)
                ?.productInstances.filter((inst) => inst.saleTransactionId === null)
                .slice(0, numAddedInstIDs)
                .map((inst) => ({
                    id: inst.id,
                    saleTransactionId,
                }));

            const result = await fetch(`/api/product_instances`, {
                method: "PATCH",
                mode: "cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ instances: productInstanceUpdates }),
            });

            if (result.status === 200) {
                refreshSaleTransactions();
                handleCloseMainDialog();
                toast.success(
                    `${selectedProduct.name}${
                        selectedProduct.type === "VARIATION" && selectedProduct.variationName
                            ? ` - ${selectedProduct.variationName}`
                            : ""
                    } edited!`,
                    { id: toastId, position: "top-right" }
                );
            } else {
                toast.error(
                    `Unable to edit ${selectedProduct.name}${
                        selectedProduct.type === "VARIATION" && selectedProduct.variationName
                            ? ` - ${selectedProduct.variationName}`
                            : ""
                    }`,
                    { id: toastId, position: "top-right" }
                );
            }
        } else if (addProductQuantity < thisSalesProductsInstances.length) {
            const numRemovedInstIDs = addProductQuantity - thisSalesProductsInstances.length;
            const productInstanceUpdates = thisSalesProductsInstances.slice(numRemovedInstIDs).map((inst) => ({
                id: inst.id,
                saleTransactionId: null,
            }));

            const result = await fetch("/api/product_instances", {
                method: "PATCH",
                mode: "cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ instances: productInstanceUpdates }),
            });

            if (result.status === 200) {
                refreshSaleTransactions();
                handleCloseMainDialog();
                toast.success(
                    `${selectedProduct.name}${
                        selectedProduct.type === "VARIATION" && selectedProduct.variationName
                            ? ` - ${selectedProduct.variationName}`
                            : ""
                    } edited!`,
                    { id: toastId, position: "top-right" }
                );
            } else {
                toast.error(
                    `Unable to edit ${selectedProduct.name}${
                        selectedProduct.type === "VARIATION" && selectedProduct.variationName
                            ? ` - ${selectedProduct.variationName}`
                            : ""
                    }`,
                    { id: toastId, position: "top-right" }
                );
            }
        }

        // if fewer quantity, release some instance IDs
    };

    const handleCloseConfirmDeleteDialog = () => setConfirmDeleteDialogOpen(false);

    const handleDeleteFromCart = () => {
        setConfirmDeleteDialogOpen(true);
    };

    const handleConfirmDeleteFromCart = async () => {
        const productInstanceUpdates = selectedProduct.productInstances
            .filter((inst) => inst.saleTransactionId === saleTransactionId)
            .map((inst) => ({
                id: inst.id,
                saleTransactionId: null,
            }));

        const toastId = toast.loading(
            `Removing ${selectedProduct.name}${
                selectedProduct.type === "VARIATION" && selectedProduct.variationName
                    ? ` - ${selectedProduct.variationName}`
                    : ""
            } from cart...`,
            { position: "top-right" }
        );
        const result = await fetch("/api/product_instances", {
            method: "PATCH",
            mode: "cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ instances: productInstanceUpdates }),
        });

        if (result.status === 200) {
            refreshSaleTransactions();
            handleCloseConfirmDeleteDialog();
            handleCloseMainDialog();
            toast.success(
                `${selectedProduct.name}${
                    selectedProduct.type === "VARIATION" && selectedProduct.variationName
                        ? ` - ${selectedProduct.variationName}`
                        : ""
                } removed!`,
                { id: toastId, position: "top-right" }
            );
        } else {
            toast.error(
                `Unable to remove ${selectedProduct.name}${
                    selectedProduct.type === "VARIATION" && selectedProduct.variationName
                        ? ` - ${selectedProduct.variationName}`
                        : ""
                }`,
                { id: toastId, position: "top-right" }
            );
        }
    };

    useEffect(() => {
        if (!open) {
            setScannerOn(false);
        }
    }, [open]);

    // watch for the add-or-edit mode prop, component is mounted on page load as "add"
    useEffect(() => {
        if (mode === "add" && initialProduct === null) {
            setSelectedProduct(null);
            setMaxQuantity(undefined);
            setAddProductQuantity(0);
        } else if (mode === "add" && initialProduct !== null) {
            setSelectedProduct(initialProduct);
            setMaxQuantity(initialProduct?.productInstances.filter((inst) => inst.saleTransactionId === null).length);
            setAddProductQuantity(1);
        } else {
            // edit mode
            setSelectedProduct(initialProduct);
            // max quantity = those products already in cart + the # of remaining available instance IDs
            setMaxQuantity(
                initialProduct?.productInstances.filter(
                    (inst) => inst.saleTransactionId === null || inst.saleTransactionId === saleTransactionId
                ).length
            );
            setAddProductQuantity(
                initialProduct?.productInstances.filter((inst) => inst.saleTransactionId === saleTransactionId).length
            );
        }
    }, [mode, initialProduct]);

    useEffect(() => {
        console.log("new mount");
        // on component unmount, make sure the scanner is turned off
        return () => {
            setScannerOn(false);
        };
    }, []);

    return (
        <>
            <Dialog open={open} onClose={handleCloseMainDialog} aria-labelledby='add-product-dialog-title'>
                <DialogTitle id='form-dialog-title' className='flex items-center'>
                    {mode === "add" ? (
                        <Add fontSize='small' className='mr-2' />
                    ) : (
                        <Edit fontSize='small' className='mr-2' />
                    )}
                    {mode === "add" ? "Add Product" : "Edit Product"}
                </DialogTitle>
                <DialogContent className='flex flex-col subtleScrollbar' ref={dialogRef}>
                    <DialogContentText className='mt-5 mb-10 mx-0'>
                        {selectedProduct !== null ? (
                            <div className='grid grid-cols-12'>
                                <div className='col-span-4'>
                                    <Image
                                        width={100}
                                        height={100}
                                        src={
                                            selectedProduct.image
                                                ? selectedProduct.image
                                                : "/images/products/SnazzyStonesPlaceholder.png"
                                        }
                                        className='w-full rounded-md'
                                        alt={`Thumbnail sized image for ${selectedProduct.name}${
                                            selectedProduct.type === "VARIATION"
                                                ? ` - ${selectedProduct.variationName}`
                                                : ""
                                        }`}
                                    />
                                </div>
                                <div className='col-span-8 grid grid-cols-12'>
                                    <div className='col-span-12'>
                                        {`${selectedProduct.name}${
                                            selectedProduct.type === "VARIATION"
                                                ? ` - ${selectedProduct.variationName}`
                                                : ""
                                        }`}
                                        <br />
                                        <span className='text-sm text-bluegreen-500'>{selectedProduct.sku}</span>
                                    </div>
                                    <div className='col-span-4 text-blueyonder-500 font-semibold'>
                                        {new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
                                            selectedProduct.targetPrice
                                        )}
                                    </div>
                                    <div className='col-span-8 flex flex-nowrap'>
                                        <Button
                                            className='bg-blueyonder-500 hover:bg-blueyonder-700 rounded-tr-none rounded-br-none text-white'
                                            variant='contained'
                                            onClick={handleDecrementProductQuantity}
                                            disabled={selectedProduct === null}
                                        >
                                            <Remove />
                                        </Button>
                                        <StyledTextbox
                                            variant='outlined'
                                            value={addProductQuantity}
                                            disabled={selectedProduct === null}
                                            fullWidth
                                        />
                                        <Button
                                            className='bg-blueyonder-500 hover:bg-blueyonder-700 rounded-tl-none rounded-bl-none text-white'
                                            variant='contained'
                                            onClick={handleIncrementProductQuantity}
                                            disabled={selectedProduct === null}
                                        >
                                            <Add />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            "No Product Selected"
                        )}
                    </DialogContentText>
                    {mode === "add" ? (
                        <div className='grid grid-cols-3 gap-2 items-center'>
                            <Button
                                className='border border-blueyonder-500 my-5 mx-0 col-span-1'
                                fullWidth
                                variant='outlined'
                                onClick={handleScannerButtonClick}
                                ref={scannerButtonRef}
                            >
                                {scannerOn ? (
                                    <>
                                        <CircularProgress size={25} className='my-0 mx-1' />
                                        Stop Scanning
                                    </>
                                ) : (
                                    <>
                                        <BarcodeScanIcon className='my-0 mx-1' />
                                        Scan Products
                                    </>
                                )}
                            </Button>
                            <div className='col-span-2'>
                                <ProductAutocomplete
                                    type='input'
                                    onValueChange={handleProductSearchSelection}
                                    productsProvided={true}
                                    providedProducts={products}
                                />
                            </div>
                            {scannerOn && <Scanner scannerOn={scannerOn} qrCodeSuccessCallback={() => {}} />}
                        </div>
                    ) : (
                        <CTAButton
                            className='mx-auto flex items-center'
                            heavyRounding={false}
                            size='medium'
                            onClick={handleDeleteFromCart}
                        >
                            <Delete className='mr-2' fontSize='small' />
                            Delete From Cart
                        </CTAButton>
                    )}
                    <CenteredAccordion className={`shadow-none mb-0`}>
                        <AccordionSummary
                            expandIcon={<ExpandMore />}
                            aria-controls='panel1a-content'
                            id='panel1a-header'
                        ></AccordionSummary>
                        <AccordionDetails>
                            <TextField
                                margin='dense'
                                id='product-price'
                                label='Price Adjustment'
                                fullWidth
                                variant='outlined'
                                value={`$${(selectedProduct ? selectedProduct.targetPrice : 0).toFixed(2)}`}
                                disabled={true}
                                helperText='Coming Soon'
                            />
                        </AccordionDetails>
                    </CenteredAccordion>
                </DialogContent>
                <DialogActions className='flex justify-between p-6'>
                    <Button onClick={handleCloseMainDialog} variant='outlined'>
                        Cancel
                    </Button>
                    <CTAButton
                        className='flex items-center'
                        onClick={mode === "add" ? handleAddProductToCart : handleEditProductInCart}
                        heavyRounding={false}
                        size='small'
                        disabled={selectedProduct === null}
                    >
                        {mode === "add" ? (
                            <Add fontSize='small' className='mr-2' />
                        ) : (
                            <Edit fontSize='small' className='mr-2' />
                        )}
                        {mode === "add" ? "Add" : "Edit"}
                    </CTAButton>
                </DialogActions>
            </Dialog>
            {mode === "edit" && selectedProduct !== null && (
                <Dialog
                    open={confirmDeleteDialogOpen}
                    onClose={handleCloseConfirmDeleteDialog}
                    aria-labelledby='confirm-delete-dialog-title'
                    aria-describedby='confirm-delete-dialog-description'
                >
                    <DialogTitle>Remove This Product?</DialogTitle>
                    <DialogContent>
                        <DialogContentText id='alert-dialog-description'>
                            Are you sure you would like to remove{" "}
                            <strong>
                                {selectedProduct.name}
                                {selectedProduct.type === "VARIATION" && selectedProduct.variationName
                                    ? ` - ${selectedProduct.variationName}`
                                    : ""}
                            </strong>{" "}
                            from the cart?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions className='flex justify-between p-6'>
                        <Button onClick={handleCloseConfirmDeleteDialog} variant='outlined'>
                            Cancel
                        </Button>
                        <CTAButton heavyRounding={false} size='small' onClick={handleConfirmDeleteFromCart}>
                            Confirm
                        </CTAButton>
                    </DialogActions>
                </Dialog>
            )}
        </>
    );
};

export default AddEditCartProduct;
