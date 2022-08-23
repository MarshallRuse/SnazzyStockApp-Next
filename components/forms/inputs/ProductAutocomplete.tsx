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
};

export default function ProductAutocomplete({ className = "", type, onValueChange = () => null }: SiteSearchProps) {
    const [products, setProducts] = useState([]);
    const [value, setValue] = useState<ProductWithInstanceStockData | null>(null);
    const inputRef = useRef(null);

    const handleClearAndCloseInput = () => {
        setValue(null);
    };

    useEffect(() => {
        const fetchProducts = async () => {
            const apiResponse = await fetch("/api/products?instanceCount=true");
            if (apiResponse.status === 200) {
                const responseProducts = await apiResponse.json();
                setProducts(responseProducts);
            } else {
                const errorMessage = await apiResponse.json();
                console.log(`Error fetching products: ${errorMessage.message}`);
            }
        };

        fetchProducts();
    }, []);

    useEffect(() => {
        console.log("autcomplete value: ", value);
        onValueChange(value);
    }, [value]);

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
                onChange={(event, newValue) => setValue(newValue)}
                openOnFocus
                clearOnEscape={type === "link"}
                // onBlur={type === "link" && handleClearAndCloseInput}
                // onClose={type === "link" && handleClearAndCloseInput}
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
                                                            : "/images/products/SnazzyStonesPlaceholder.png"
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
                                                    : "/images/products/SnazzyStonesPlaceholder.png"
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
