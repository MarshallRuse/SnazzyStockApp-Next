import { ReactNode } from "react";

export type MenuItem = {
    isLink: boolean;
    link?: string;
    displayText: string;
    displayIcon?: () => ReactNode;
    submenu?: MenuItem[];
};
