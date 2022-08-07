import { ReactNode } from "react";
const widescreenComponent = "hidden md:flex md:flex-col items-start py-6";
const mobileComponent = "flex flex-col items-start py-6";

type Props = {
    children: ReactNode;
    className?: string;
    widescreen?: boolean;
};

export default function MenuListItem({ children, className, widescreen = false }: Props) {
    return <li className={`${widescreen ? widescreenComponent : mobileComponent} ${className}`}>{children}</li>;
}
