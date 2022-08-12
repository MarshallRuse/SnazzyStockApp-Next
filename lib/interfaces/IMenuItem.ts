import { ReactElement } from "react";

export type IMenuItem = {
    isLink: boolean;
    link?: string;
    displayText: string;
    displayIcon?: () => ReactElement;
    submenu?: IMenuItem[];
};
