import type { ProductCategory } from "@prisma/client";
import Image from "next/image";
import type { ProductWithInstanceStockData } from "lib/interfaces/ProductWithInstanceStockData";
import ShoppingCart from "@mui/icons-material/ShoppingCart";

const CartProductCard = ({
    product,
    category,
    onCartItemClicked,
}: {
    product: ProductWithInstanceStockData;
    category: ProductCategory;
    onCartItemClicked: (p: ProductWithInstanceStockData) => void;
}) => {
    const disabled = product.productInstances.filter((inst) => inst.saleTransactionId === null).length === 0;
    const disabledColor = "text-zinc-400";
    return (
        <div
            className={`flex flex-col p-4 border border-zinc-100 rounded-md shadow-light w-56 mx-auto ${
                !disabled ? "cursor-pointer transition hover:scale-105 hover:shadow-bluegreenLight group" : ""
            }`}
            onClick={() => onCartItemClicked(product)}
        >
            <div className={`flex rounded-lg aspect-square w-full h-full relative ${disabled ? "grayscale" : ""}`}>
                <Image
                    layout='fill'
                    objectFit='cover'
                    src={product.image ? product.image : "/images/products/SnazzyStonesPlaceholder.png"}
                    alt={`Product image for ${product.name}`}
                    className='rounded-lg'
                />
                {!disabled && (
                    <div
                        className={`absolute top-0 left-0 bottom-0 right-0 flex justify-center items-center bg-white/75 opacity-0 text-bluegreen-500 text-6xl rounded-md ${
                            !disabled ? "transition group-hover:opacity-100" : ""
                        }`}
                    >
                        <ShoppingCart fontSize='inherit' />
                    </div>
                )}
            </div>
            <p className='m-0 mt-4 text-zinc-400 text-xs'>{category.name}</p>
            <p className={`text-base m-0 ${disabled ? disabledColor : ""}`}>{`${product.name}${
                product.type === "VARIATION" && product.variationName ? ` - ${product.variationName}` : ""
            }`}</p>
            <p className={`text-sm ${!disabled ? "text-bluegreen-500" : disabledColor} m-0`}>{product.sku}</p>
            <p className='flex justify-between items-baseline m-0 mt-4'>
                <span className={`${!disabled ? "text-blueyonder-500" : disabledColor} font-semibold`}>
                    {new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(product.targetPrice)}
                </span>
                <span className={`text-sm ${disabled ? "text-cerise-500" : ""}`}>
                    {product.productInstances.filter((inst) => inst.saleTransactionId === null).length} in stock
                </span>
            </p>
        </div>
    );
};

export default CartProductCard;
