import { Controller, useFormContext } from "react-hook-form";
import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from "@mui/material";
import ReactHookFormTextField from "./inputs/RHookFormTextField";

type Unit = {
    value: string;
    label: string;
};

const distanceUnits: Unit[] = [
    {
        value: "inch",
        label: "inch",
    },
    {
        value: "mm",
        label: "millimeter",
    },
];

const massUnits: Unit[] = [
    {
        value: "g",
        label: "grams",
    },
    {
        value: "oz",
        label: "ounces",
    },
];

type ProductAttributeInputsProps = {
    productType: "SIMPLE" | "VARIATION";
    index?: number;
    disabled: boolean;
};

const ProductAttributeInputs = ({ productType = "SIMPLE", index = null }: ProductAttributeInputsProps) => {
    const methods = useFormContext();

    return (
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 my-4'>
            <ReactHookFormTextField
                name={productType === "SIMPLE" ? "length" : `variations.${index}.length`}
                label={`Length`}
                type='number'
            />
            <Controller
                name={productType === "SIMPLE" ? "lengthUnit" : `variations.${index}.lengthUnit`}
                control={methods.control}
                render={({ field }) => (
                    <FormControl
                        className='flex w-full'
                        error={!!methods.formState.errors["variations"]?.[index]?.["lengthUnit"]}
                    >
                        <InputLabel id='length-unit-label'>Units</InputLabel>
                        <Select labelId='length-unit-label' label='Units' defaultValue={""} {...field}>
                            {distanceUnits.map((unit: Unit) => (
                                <MenuItem key={`length-units-${unit.value}`} value={unit.value}>
                                    {unit.label}
                                </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText>
                            {methods.formState.errors["variations"]?.[index]?.["lengthUnit"]?.message?.toString() ?? ""}
                        </FormHelperText>
                    </FormControl>
                )}
            />

            <ReactHookFormTextField
                name={productType === "SIMPLE" ? "width" : `variations.${index}.width`}
                label={`Width`}
                type='number'
            />
            <Controller
                name={productType === "SIMPLE" ? "widthUnit" : `variations.${index}.widthUnit`}
                control={methods.control}
                render={({ field }) => (
                    <FormControl
                        className='flex w-full'
                        error={!!methods.formState.errors["variations"]?.[index]?.["widthUnit"]}
                    >
                        <InputLabel id='width-unit-label'>Units</InputLabel>
                        <Select labelId='width-unit-label' label='Units' defaultValue={""} {...field}>
                            {distanceUnits.map((unit: Unit) => (
                                <MenuItem key={`width-units-${unit.value}`} value={unit.value}>
                                    {unit.label}
                                </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText>
                            {methods.formState.errors["variations"]?.[index]?.["widthUnit"]?.message?.toString() ?? ""}
                        </FormHelperText>
                    </FormControl>
                )}
            />
            <ReactHookFormTextField
                name={productType === "SIMPLE" ? "height" : `variations.${index}.height`}
                label={`Height`}
                type='number'
            />
            <Controller
                name={productType === "SIMPLE" ? "heightUnit" : `variations.${index}.heightUnit`}
                control={methods.control}
                render={({ field }) => (
                    <FormControl
                        className='flex w-full'
                        error={!!methods.formState.errors["variations"]?.[index]?.["heightUnit"]}
                    >
                        <InputLabel id='height-unit-label'>Units</InputLabel>
                        <Select labelId='height-unit-label' label='Units' defaultValue={""} {...field}>
                            {distanceUnits.map((unit: Unit) => (
                                <MenuItem key={`height-units-${unit.value}`} value={unit.value}>
                                    {unit.label}
                                </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText>
                            {methods.formState.errors["variations"]?.[index]?.["heightUnit"]?.message?.toString() ?? ""}
                        </FormHelperText>
                    </FormControl>
                )}
            />
            <ReactHookFormTextField
                name={productType === "SIMPLE" ? "weight" : `variations.${index}.weight`}
                label={`Weight`}
                type='number'
            />
            <Controller
                name={productType === "SIMPLE" ? "weightUnit" : `variations.${index}.weightUnit`}
                control={methods.control}
                render={({ field }) => (
                    <FormControl
                        className='flex w-full'
                        error={!!methods.formState.errors["variations"]?.[index]?.["weightUnit"]}
                    >
                        <InputLabel id='weight-unit-label'>Units</InputLabel>
                        <Select labelId='weight-unit-label' label='Units' defaultValue={""} {...field}>
                            {massUnits.map((unit: Unit) => (
                                <MenuItem key={`weight-units-${unit.value}`} value={unit.value}>
                                    {unit.label}
                                </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText>
                            {methods.formState.errors["variations"]?.[index]?.["weightUnit"]?.message?.toString() ?? ""}
                        </FormHelperText>
                    </FormControl>
                )}
            />
        </div>
    );
};

export default ProductAttributeInputs;
