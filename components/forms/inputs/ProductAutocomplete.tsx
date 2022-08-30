import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Autocomplete, TextField } from "@mui/material";
import Search from "@mui/icons-material/Search";
import type { Product } from "@prisma/client";
import type { ProductWithInstanceStockData } from "lib/interfaces/ProductWithInstanceStockData";

type SiteSearchProps = {
    className?: string;
    type: "link" | "input";
    onValueChange?: (v: ProductWithInstanceStockData | null) => void;
    productsProvided?: boolean;
    providedProducts?: ProductWithInstanceStockData[];
};

export default function ProductAutocomplete({
    className = "",
    type,
    onValueChange = () => null,
    productsProvided = false,
    providedProducts = [],
}: SiteSearchProps) {
    const [products, setProducts] = useState([]);
    const [value, setValue] = useState<ProductWithInstanceStockData | null>(null);
    const inputRef = useRef(null);

    const handleClearAndCloseInput = () => {
        setValue(null);
    };

    const handleValueChange = (val) => {
        setValue(val);
        onValueChange(val);
    };

    useEffect(() => {
        if (productsProvided) {
            setProducts(providedProducts); // yes, antipattern to use derived state, but products are only ever set here after being provided
        } else {
            const fetchProducts = async () => {
                try {
                    const apiResponse = await fetch("/api/products?instanceCount=true");
                    if (apiResponse.status === 200) {
                        const responseProducts = await apiResponse.json();
                        setProducts(responseProducts);
                    } else {
                        const errorMessage = await apiResponse.json();
                        console.log(`Error fetching products: ${errorMessage.message}`);
                    }
                } catch (err) {
                    console.log("fetch api/products Error: ", err);
                }
            };

            fetchProducts();
        }
    }, [productsProvided, providedProducts]);

    return (
        <div
            className={`flex items-center justify-center w-full relative text-blueyonder-500 hover:text-bluegreen-500 transition ${className}`}
        >
            <Autocomplete
                id='products-autocomplete'
                sx={{
                    width: "100%",
                }}
                fullWidth={true}
                options={products}
                loading={products.length === 0}
                loadingText='Loading Snazziness...'
                value={value}
                onChange={(event, newValue) => handleValueChange(newValue)}
                openOnFocus
                clearOnEscape
                blurOnSelect
                onBlur={handleClearAndCloseInput}
                onClose={handleClearAndCloseInput}
                getOptionLabel={(product: ProductWithInstanceStockData) => product?.name}
                renderOption={(props, product: ProductWithInstanceStockData) => {
                    if (type === "link") {
                        return (
                            <li {...props} key={product.id}>
                                <Link href={`/products/${product.sku}`}>
                                    <a className='flex items-center gap-4'>
                                        <div className='flex-grow flex-shrink-0 w-20 h-20 mr-4'>
                                            {product.image && (
                                                <Image
                                                    width={75}
                                                    height={75}
                                                    src={
                                                        product.image
                                                            ? product.image
                                                            : "images/products/SnazzyStonesPlaceholder.png"
                                                    }
                                                    className='w-full'
                                                    alt={`Thumbnail sized image for ${`${product.name}${
                                                        product.variationName ? ` - ${product.variationName}` : ""
                                                    }`}`}
                                                />
                                            )}
                                        </div>
                                        <div className='flex-grow-0 line-clamp-2'>{`${product.name}${
                                            product.variationName ? ` - ${product.variationName}` : ""
                                        }`}</div>
                                    </a>
                                </Link>
                            </li>
                        );
                    } else {
                        return (
                            <li {...props} key={product.id}>
                                <div className='flex-grow flex-shrink-0 w-20 h-20 mr-4'>
                                    {product.image && (
                                        <Image
                                            width={75}
                                            height={75}
                                            src={
                                                product.image
                                                    ? product.image
                                                    : "images/products/SnazzyStonesPlaceholder.png"
                                            }
                                            className='w-full'
                                            alt={`Thumbnail sized image for ${`${product.name}${
                                                product.variationName ? ` - ${product.variationName}` : ""
                                            }`}`}
                                        />
                                    )}
                                </div>
                                <div className='flex-grow-0 line-clamp-2'>{`${product.name}${
                                    product.variationName ? ` - ${product.variationName}` : ""
                                }`}</div>
                            </li>
                        );
                    }
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        inputRef={inputRef}
                        label='Search Products'
                        color='primary'
                        inputProps={{
                            ...params.inputProps,
                            autoComplete: "new-password", // disable autocomplete and autofill
                        }}
                    />
                )}
            />
        </div>
    );
}
