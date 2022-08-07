import { forwardRef, ReactNode } from "react";

type Props = {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
};

const HoverStyledAnchor = forwardRef<HTMLAnchorElement, Props>(({ children, className, ...rest }, ref) => {
    return (
        <a
            ref={ref}
            className={`py-6 md:py-0 transition-all duration-300 hover:text-bluegreen-500 cursor-pointer ${className}`}
            {...rest}
        >
            {children}
        </a>
    );
});

HoverStyledAnchor.displayName = "HoverStyledAnchor";

export default HoverStyledAnchor;
