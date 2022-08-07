import { ProductCategory } from "@prisma/client";
import { useState, useEffect } from "react";
import * as Yup from "yup";
import { Controller, FormProvider, useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
    Button,
    FormControl,
    FormControlLabel,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Radio,
    RadioGroup,
    Select,
    TextField,
} from "@mui/material";
import Add from "@mui/icons-material/Add";
import Delete from "@mui/icons-material/Delete";
import ReactHookFormTextField from "./inputs/RHookFormTextField";

type ProductAttributeInputsProps = {
    productType: "SIMPLE" | "VARIATION";
    index?: number;
    disabled: boolean;
};

const ProductAttributeInputs = ({ productType = "SIMPLE", index = null }: ProductAttributeInputsProps) => (
    <div className='grid grid-cols-2 md:grid-cols-4 gap-4 my-4'>
        <ReactHookFormTextField
            name={productType === "SIMPLE" ? "length" : `variations.${index}.length`}
            label={`Length`}
            type='number'
        />
        <ReactHookFormTextField
            name={productType === "SIMPLE" ? "lengthUnit" : `variations.${index}.lengthUnit`}
            label={`Units`}
        />
        <ReactHookFormTextField
            name={productType === "SIMPLE" ? "width" : `variations.${index}.width`}
            label={`Width`}
            type='number'
        />
        <ReactHookFormTextField
            name={productType === "SIMPLE" ? "widthUnit" : `variations.${index}.widthUnit`}
            label={`Units`}
        />
        <ReactHookFormTextField
            name={productType === "SIMPLE" ? "height" : `variations.${index}.height`}
            label={`Height`}
            type='number'
        />
        <ReactHookFormTextField
            name={productType === "SIMPLE" ? "heightUnit" : `variations.${index}.heightUnit`}
            label={`Units`}
        />
        <ReactHookFormTextField
            name={productType === "SIMPLE" ? "weight" : `variations.${index}.weight`}
            label={`Weight`}
            type='number'
        />
        <ReactHookFormTextField
            name={productType === "SIMPLE" ? "weightUnit" : `variations.${index}.weightUnit`}
            label={`Units`}
        />
    </div>
);

const ProductSchema = Yup.object().shape({
    sku: Yup.string().trim().required(),
    name: Yup.string().trim().required(),
    category: Yup.string().trim().required(),
    description: Yup.string().trim(),
    type: Yup.string().trim().required().oneOf(["SIMPLE", "VARIABLE", "VARIATION"]),
    image: Yup.string().trim().url(),
    length: Yup.number().positive(),
    lengthUnit: Yup.string().trim(),
    width: Yup.number().positive(),
    widthUnit: Yup.string().trim(),
    height: Yup.number().positive(),
    heightUnit: Yup.string().trim(),
    weight: Yup.number().positive(),
    weightUnit: Yup.string().trim(),
    variations: Yup.array(),
    /*.of(
        Yup.object().shape({
            sku: Yup.string().trim().required(),
            name: Yup.string().trim().required(),
            length: Yup.number().positive(),
            lengthUnit: Yup.string().trim(),
            width: Yup.number().positive(),
            widthUnit: Yup.string().trim(),
            height: Yup.number().positive(),
            heightUnit: Yup.string().trim(),
            weight: Yup.number().positive(),
            weightUnit: Yup.string().trim(),
        })
    ).compact(v => v.sku !== "" || v.name !== ""),*/
});

type ProductFormValues = {
    sku: string;
    name: string;
    category: string;
    description: string;
    type: string;
    image: string;
    variations: {
        sku: string;
        name: string;
        length: number;
        lengthUnit: string;
        width: number;
        widthUnit: string;
        height: number;
        heightUnit: string;
        weight: number;
        weightUnit: string;
    }[];
};

type ProductFormProps = {
    initialValues: ProductFormValues;
    categories: ProductCategory[];
    redirectPath?: string;
    onSubmit: () => void;
};

export default function ProductForm({ initialValues = null, categories = [], redirectPath = "" }: ProductFormProps) {
    // initial values
    const { ...initialFormValues } = initialValues ?? {
        sku: "",
        name: "",
        category: "",
        description: "",
        type: "SIMPLE",
        image: "",
        length: null,
        lengthUnit: "",
        width: null,
        widthUnit: "",
        height: null,
        heightUnit: "",
        weight: null,
        weightUnit: "",
        variations: [
            {
                sku: "",
                name: "",
                length: null,
                lengthUnit: "",
                width: null,
                widthUnit: "",
                height: null,
                heightUnit: "",
                weight: null,
                weightUnit: "",
            },
        ],
    };

    // react-hook-forms
    const methods = useForm({
        defaultValues: initialFormValues,
        //resolver: yupResolver(ProductSchema),
    });
    const { fields, append, remove } = useFieldArray<ProductFormValues>({
        control: methods.control, // control props comes from useForm
        name: "variations",
    });

    const watchType = methods.watch("type");
    const watchSKU = methods.watch("sku");

    const onSubmit: SubmitHandler<ProductFormValues> = async (data: ProductFormValues) => console.log(data);

    // state
    const [disabled, setDisabled] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    return (
        <FormProvider {...methods}>
            <form className='flex flex-col gap-8 mx-2 max-w-screen-md' onSubmit={methods.handleSubmit(onSubmit)}>
                <div className='flex gap-4 w-full'>
                    <ReactHookFormTextField name='sku' label='SKU' />
                    <ReactHookFormTextField name='name' label='Name' />
                </div>

                <Controller
                    name='category'
                    control={methods.control}
                    render={({ field }) => (
                        <FormControl required {...field} className='flex w-full'>
                            <InputLabel id='category-label'>Category</InputLabel>
                            <Select labelId='category-label' label='Category *'>
                                {categories.map((cat: ProductCategory) => (
                                    <MenuItem value={cat.id}>{cat.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                />

                <ReactHookFormTextField name='description' label='Description' textArea />

                <Controller
                    name='type'
                    control={methods.control}
                    render={({ field }) => (
                        <RadioGroup row {...field}>
                            <FormControlLabel
                                value='SIMPLE'
                                control={<Radio disabled={isSubmitting} />}
                                label='Standalone Product'
                                disabled={isSubmitting}
                            />
                            <FormControlLabel
                                value='VARIABLE'
                                control={<Radio disabled={isSubmitting} />}
                                label='Variable Product'
                                disabled={isSubmitting}
                            />
                        </RadioGroup>
                    )}
                />

                {watchType === "SIMPLE" && <ProductAttributeInputs productType='SIMPLE' disabled={disabled} />}
                {watchType === "VARIABLE" && (
                    <div className='flex flex-col items-center gap-4'>
                        {fields.map((field, index) => (
                            <div key={field.id} className='p-4 border border-zinc-300 rounded-md'>
                                <div className='flex justify-between items-center'>
                                    <p>Variation {index + 1}</p>
                                    <IconButton aria-label='remove' onClick={() => remove(index)}>
                                        <Delete />
                                    </IconButton>
                                </div>
                                <div className='flex gap-2'>
                                    <Controller
                                        name={`variations.${index}.sku`}
                                        control={methods.control}
                                        render={({ field }) => (
                                            <TextField
                                                label={`Variation ${index + 1} SKU`}
                                                placeholder='XXX-00'
                                                variant='outlined'
                                                disabled={disabled}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment className='mr-0' position='start'>
                                                            {`${watchSKU}-`}
                                                        </InputAdornment>
                                                    ),
                                                }}
                                                {...field}
                                            />
                                        )}
                                    />
                                    <Controller
                                        name={`variations.${index}.name`}
                                        control={methods.control}
                                        render={({ field }) => (
                                            <TextField
                                                className='flex-grow'
                                                label={`Variation ${index + 1} Name`}
                                                placeholder='16 inch'
                                                variant='outlined'
                                                disabled={disabled}
                                                {...field}
                                            />
                                        )}
                                    />
                                </div>
                                <ProductAttributeInputs productType='VARIATION' index={index} disabled={disabled} />
                            </div>
                        ))}
                        <Button
                            variant='outlined'
                            color='secondary'
                            onClick={() =>
                                append({
                                    sku: "",
                                    name: "",
                                    length: null,
                                    lengthUnit: "",
                                    width: null,
                                    widthUnit: "",
                                    height: null,
                                    heightUnit: "",
                                    weight: null,
                                    weightUnit: "",
                                })
                            }
                        >
                            <Add /> Add Variation
                        </Button>
                    </div>
                )}
                <div className='flex justify-end'>
                    <button
                        type='submit'
                        disabled={disabled}
                        className='bg-rose-600 text-white py-2 px-6 rounded-md focus:outline-none focus:ring-4 focus:ring-rose-600 focus:ring-opacity-50 hover:bg-rose-500 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-rose-600'
                    >
                        {isSubmitting ? "Submitting..." : "Submit"}
                    </button>
                </div>
            </form>
        </FormProvider>
    );
}
