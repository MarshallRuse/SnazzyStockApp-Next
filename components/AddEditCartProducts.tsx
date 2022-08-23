import { useState, useEffect, useRef } from "react";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Autocomplete,
    Button,
    CircularProgress,
    createFilterOptions,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    InputAdornment,
    TextField,
} from "@mui/material";
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    ExpandMore as ExpandMoreIcon,
    Remove as SubtractIcon,
    Search as SearchIcon,
} from "@mui/icons-material";
import BarcodeScanIcon from "./BarcodeScanIcon";
import ProductAutocomplete from "./forms/inputs/ProductAutocomplete";
import Scanner from "./Scanner";
import styles from "../styles/AddEditCartProducts.module.scss";
import type { ProductWithInstanceStockData } from "lib/interfaces/ProductWithInstanceStockData";

type AddEditCartProductProps = {
    open: boolean;
    mode: "add" | "edit";
    cartItemToEdit: any;
    saleTransactionId: string;
    close: () => void;
    refreshSaleTransactions: () => void;
    products: ProductWithInstanceStockData[];
};

const AddEditCartProduct = ({
    open,
    close,
    mode,
    cartItemToEdit,
    saleTransactionId,
    refreshSaleTransactions,
    products = [],
}: AddEditCartProductProps) => {
    const dialogRef = useRef(null);
    const scannerButtonRef = useRef(null);

    const [selectedProduct, setSelectedProduct] = useState<ProductWithInstanceStockData | null>(null);
    const [scannerOn, setScannerOn] = useState(false);
    const [maxQuantity, setMaxQuantity] = useState(0);
    const [freshAvailableProducts, setFreshAvailableProducts] = useState(false);
    const [availableProducts, setAvailableProducts] = useState([]);
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
        setFreshAvailableProducts(false);
        setScannerOn(false);
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
        const result = await fetch("/api/product_instances", {
            method: "PATCH",
            mode: "cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ instances: productInstanceUpdates }),
        });

        if (result.status === 200) {
            refreshSaleTransactions();
            handleCloseMainDialog();
        }
    };

    const handleEditProductInCart = async () => {
        // if larger quantity after edit, add more instance IDs
        const thisSalesProductsInstances = selectedProduct.productInstances.filter(
            (inst) => inst.saleTransactionId === saleTransactionId
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
        }
    };

    const processProductAvailableStock = (productInstances) => {
        const processedProducts = [];

        productInstances.forEach((inst) => {
            console.log("inst: ", inst);
            // if the product type has not been added to the list of processed products, add it
            const ppIndex = processedProducts.findIndex((el) => el.SKU === inst.SKU);
            if (ppIndex === -1) {
                const newProd = {
                    SKU: inst.SKU,
                    Product_Name: `${inst.Product_Name}${
                        inst.Product_Variation_Name !== null ? ` (${inst.Product_Variation_Name})` : ""
                    }`,
                    Typical_Price: inst.Target_Price,
                    instance_IDs: [],
                };

                // Push this Product's Product_Instance_ID if this product has any instances in stock
                // (all products are returned from a LEFT JOIN, if not in stock would be a single record
                // for product with Product_Instance_ID = NULL)
                if (inst.Product_Instance_ID !== null) {
                    newProd.instance_IDs.push(inst.Product_Instance_ID);
                }
                console.log("newProd: ", newProd);
                processedProducts.push(newProd);
            } else {
                // if product in processed products already, then just push an Instance ID,
                // as multiple products mean multiple instances
                processedProducts[ppIndex].instance_IDs.push(inst.Product_Instance_ID);
            }
        });

        return processedProducts;
    };

    useEffect(() => {
        if (!open) {
            setScannerOn(false);
        }
    }, [open]);

    // watch for the add-or-edit mode prop, component is mounted on page load as "add"
    useEffect(() => {
        if (mode === "add") {
            setSelectedProduct(null);
            setMaxQuantity(undefined);
            setAddProductQuantity(1);
        } else {
            setSelectedProduct(cartItemToEdit);
            // max quantity = those products already in cart + the # of remaining available instance IDs
            setMaxQuantity(
                availableProducts.length
                    ? availableProducts.filter((prod) => prod.SKU === cartItemToEdit.SKU)[0].instance_IDs.length +
                          cartItemToEdit.instance_IDs.length
                    : 0
            );
            setAddProductQuantity(cartItemToEdit.instance_IDs.length);
        }
    }, [mode, cartItemToEdit]);

    // on component unmount, make sure the scanner is turned off
    useEffect(() => {
        return () => {
            setScannerOn(false);
        };
    }, []);

    return (
        <>
            <Dialog open={open} onClose={handleCloseMainDialog} aria-labelledby='add-product-dialog-title'>
                <DialogTitle id='form-dialog-title'>{mode === "add" ? "Add Product" : "Edit Product"}</DialogTitle>
                <DialogContent className='flex flex-col' ref={dialogRef}>
                    <DialogContentText className='mt-5 mb-10 mx-0'>
                        {selectedProduct !== null ? (
                            <div className='grid grid-cols-12 items-center'>
                                <div className='col-span-3'>{selectedProduct.sku}</div>
                                <div className='col-span-6 text-blueyonder-500'>{selectedProduct.name}</div>
                                <div className='col-span-3 text-right'>
                                    {`$${selectedProduct.targetPrice.toFixed(2)}`}
                                </div>
                            </div>
                        ) : (
                            "No Product Selected"
                        )}
                    </DialogContentText>
                    {mode === "add" ? (
                        <>
                            <ProductAutocomplete type='input' onValueChange={handleProductSearchSelection} />
                            {scannerOn && <Scanner scannerOn={scannerOn} qrCodeSuccessCallback={() => {}} />}

                            <Button
                                className='border border-blueyonder-500 my-5 mx-0'
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
                        </>
                    ) : (
                        <Button
                            className='mx-auto max-w-xs'
                            color='secondary'
                            variant='contained'
                            onClick={handleDeleteFromCart}
                        >
                            Delete From Cart
                            <DeleteIcon />
                        </Button>
                    )}

                    <div className='grid grid-cols-12'>
                        <div className='col-span-12 flex justify-center my-5'>
                            <Button
                                className='bg-blueyonder-500 hover:bg-blueyonder-700 rounded-tr-none rounded-br-none text-white'
                                variant='contained'
                                onClick={handleDecrementProductQuantity}
                                disabled={selectedProduct === null}
                            >
                                <SubtractIcon />
                            </Button>
                            <TextField
                                className={styles.addProductQuantityTextbox}
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
                                <AddIcon />
                            </Button>
                        </div>
                    </div>
                    <Accordion className='shadow-none mb-0'>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
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
                    </Accordion>
                </DialogContent>
                <DialogActions className='flex justify-between p-6'>
                    <Button onClick={handleCloseMainDialog} variant='outlined'>
                        Cancel
                    </Button>
                    <Button
                        onClick={mode === "add" ? handleAddProductToCart : handleEditProductInCart}
                        color={selectedProduct !== null ? "secondary" : "inherit"}
                        variant='contained'
                        disabled={selectedProduct === null}
                    >
                        {mode === "add" ? "Add" : "Edit"}
                    </Button>
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
                            Are you sure you would like to remove <strong>{selectedProduct.name}</strong> from the cart?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions className='flex justify-between p-6'>
                        <Button onClick={handleCloseConfirmDeleteDialog} variant='outlined'>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmDeleteFromCart} variant='contained' color='secondary'>
                            Confirm
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </>
    );
};

export default AddEditCartProduct;
