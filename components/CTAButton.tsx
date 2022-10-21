import { forwardRef, ReactNode, SyntheticEvent } from "react";

interface Props {
    type?: "button" | "link";
    children?: ReactNode;
    className?: string;
    heavyRounding?: boolean;
    size?: "small" | "medium" | "large";
    color?: "primary" | "secondary" | "other";
    colorClass?: string;
    disabled?: boolean;
    onClick?: (e?: SyntheticEvent) => void;
}

const CTAButton = forwardRef<HTMLButtonElement & HTMLAnchorElement, Props>(
    (
        {
            type = "button",
            children,
            className = "",
            heavyRounding = true,
            size = "large",
            color = "secondary",
            colorClass = "cerise-500",
            disabled = false,
            ...rest
        },
        ref
    ) => {
        let sizeFactors: string;
        switch (size) {
            case "small":
                sizeFactors = "py-2 px-6 min-w-[8rem]";
                break;
            case "medium":
                sizeFactors = "py-3 px-8 min-w-[10rem]";
                break;
            case "large":
                sizeFactors = "py-4 px-10 min-w-[12rem]";
                break;
            default:
                sizeFactors = "py-3 px-8 min-w-[10rem]";
        }

        const primaryColor = "bluegreen-500";
        const secondaryColor = "cerise-500";
        const getColorFactors = (color: string): string => {
            const c: string = color.split("-")[0];
            const level: number = parseInt(color.split("-")[1]);
            if (c && level) {
                return disabled
                    ? `bg-${c}-${Math.max(50, level - 300)} pointer-events-none`
                    : `bg-${c}-${level} transition-all duration-300  hover:bg-${c}-${Math.max(
                          50,
                          level - 100
                      )} hover:scale-110 focus:bg-${c}-${Math.max(
                          50,
                          level - 100
                      )} focus:scale-110 active:bg-${c}-${Math.min(
                          900,
                          level + 100
                      )} cursor-pointer focus:outline-none focus:ring focus:ring-${c}-${Math.min(
                          900,
                          level + 100
                      )} focus:ring-offset-2`;
            } else {
                return "-1";
            }
        };

        let colorFactors: string;
        switch (color) {
            case "primary":
                colorFactors = getColorFactors(primaryColor);
                break;
            case "secondary":
                colorFactors = getColorFactors(secondaryColor);
                break;
            case "other":
                colorFactors = getColorFactors(colorClass);
                break;
            default:
                colorFactors = getColorFactors(secondaryColor);
        }

        return type === "button" ? (
            <button
                ref={ref}
                className={`inline-block text-white text-sm font-normal tracking-wider no-underline uppercase whitespace-nowrap ${
                    heavyRounding ? "rounded-3xl" : "rounded-md"
                } ${sizeFactors} ${colorFactors} ${className}`}
                {...rest}
            >
                {children}
            </button>
        ) : (
            <a
                ref={ref}
                className={`inline-block text-white text-sm font-normal tracking-wider no-underline uppercase whitespace-nowrap ${
                    heavyRounding ? "rounded-3xl" : "rounded-md"
                } ${sizeFactors} ${colorFactors} ${className}`}
                {...rest}
            >
                {children}
            </a>
        );
    }
);

CTAButton.displayName = "CTAButton";

export default CTAButton;
