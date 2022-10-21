import { IProductFormVariationValues } from "./IProductFormVariationValues";

export interface IProductFormValues {
    id?: string;
    sku: string;
    name: string;
    category: string;
    HBCSku: string;
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
