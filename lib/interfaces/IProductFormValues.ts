import { IProductFormVariationValues } from "./IProductFormVariationValues";

export interface IProductFormValues {
    sku: string;
    name: string;
    category: string;
    description: string;
    type: string;
    image: string;
    length: number;
    lengthUnit: string;
    width: number;
    widthUnit: string;
    height: number;
    heightUnit: string;
    weight: number;
    weightUnit: string;
    variations: IProductFormVariationValues[];
}
