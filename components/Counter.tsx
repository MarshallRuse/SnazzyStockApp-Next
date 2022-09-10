import { useEffect, useRef } from "react";
import { animate } from "framer-motion";

type CounterProps = {
    from?: number;
    to: number;
    duration?: number;
    decimalPlaces?: number;
    style?: "none" | "currency";
    className?: string;
};

const Counter = ({ from = 0, to, duration = 1, decimalPlaces = 0, style = "none", className = "" }: CounterProps) => {
    const nodeRef = useRef<HTMLParagraphElement | null>(null);

    const currencyFormatter = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });

    useEffect(() => {
        const node = nodeRef.current;

        const controls = animate(from, to, {
            duration,
            ease: "easeOut",
            onUpdate(value) {
                node.textContent =
                    style === "currency" ? currencyFormatter.format(value) : value.toFixed(decimalPlaces).toString();
            },
        });

        return () => controls.stop();
    }, [from, to]);

    return <p ref={nodeRef} className={`m-0 ${className}`} />;
};

export default Counter;
