import { Prisma, ProductCategory } from "@prisma/client";
import { useState } from "react";
import { SchemaOf, string, number, object, array } from "yup";
import { Controller, FormProvider, useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
    Button,
    FormControl,
    FormControlLabel,
    FormHelperText,
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
import ProductAttributeInputs from "./ProductAttributeSubForm";
import { IProductFormValues } from "lib/interfaces/IProductFormValues";
import { IProductFormVariationValues } from "lib/interfaces/IProductFormVariationValues";
import toast from "react-hot-toast";

const ProductVariationSchema: SchemaOf<IProductFormVariationValues> = object({
    sku: string().trim().when("type", {
        is: "VARIABLE",
        then: string().required(),
    }),
    name: string().trim().when("type", {
        is: "VARIABLE",
        then: string().required(),
    }),
    length: number()
        .positive()
        .transform((value) => (isNaN(value) ? undefined : value))
        .nullable(true),
    lengthUnit: string().trim(),
    width: number()
        .positive()
        .transform((value) => (isNaN(value) ? undefined : value))
        .nullable(true),
    widthUnit: string().trim(),
    height: number()
        .positive()
        .transform((value) => (isNaN(value) ? undefined : value))
        .nullable(true),
    heightUnit: string().trim(),
    weight: number()
        .positive()
        .transform((value) => (isNaN(value) ? undefined : value))
        .nullable(true),
    weightUnit: string().trim(),
});

const ProductSchema: SchemaOf<IProductFormValues> = object({
    sku: string().trim().required(),
    name: string().trim().required(),
    category: string().trim().required(),
    description: string().trim(),
    type: string().trim().required().oneOf(["SIMPLE", "VARIABLE", "VARIATION"]),
    image: string().trim().url(),
    length: number()
        .positive()
        .transform((value) => (isNaN(value) ? undefined : value))
        .nullable(true),
    lengthUnit: string().trim(),
    width: number()
        .positive()
        .transform((value) => (isNaN(value) ? undefined : value))
        .nullable(true),
    widthUnit: string().trim(),
    height: number()
        .positive()
        .transform((value) => (isNaN(value) ? undefined : value))
        .nullable(true),
    heightUnit: string().trim(),
    weight: number()
        .positive()
        .transform((value) => (isNaN(value) ? undefined : value))
        .nullable(true),
    weightUnit: string().trim(),
    variations: array().of(ProductVariationSchema).when("type", {
        is: "VARIABLE",
        then: array().required(),
    }),
});

type ProductFormProps = {
    initialValues: IProductFormValues;
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
        resolver: yupResolver(ProductSchema),
    });
    const { fields, append, remove } = useFieldArray<IProductFormValues>({
        control: methods.control, // control props comes from useForm
        name: "variations",
    });

    const watchType = methods.watch("type");
    const watchSKU = methods.watch("sku");

    const onSubmit: SubmitHandler<IProductFormValues> = async (data: IProductFormValues) => {
        console.log(data);
        try {
            const { sku, name, type, description } = data;
            const newProducts: Prisma.ProductCreateWithoutCategoryInput[] = [];

            if (type === "SIMPLE") {
                const simpleProduct: Prisma.ProductCreateWithoutCategoryInput = {
                    sku,
                    name,
                    type,
                    description,
                    length: data.length,
                    lengthUnit: data.lengthUnit,
                    width: data.width,
                    widthUnit: data.widthUnit,
                    height: data.height,
                    heightUnit: data.heightUnit,
                    weight: data.weight,
                    weightUnit: data.weightUnit,
                };
                newProducts.push(simpleProduct);
            } else if (type === "VARIABLE") {
                const parentProduct: Prisma.ProductCreateWithoutCategoryInput = {
                    sku,
                    name,
                    type,
                    description,
                };
                newProducts.push(parentProduct);

                data.variations.forEach((variation) => {
                    const variant: Prisma.ProductCreateWithoutCategoryInput = {
                        sku: `${data.sku}-${variation.sku}`,
                        name,
                        type: "VARIATION",
                        variationName: variation.name,
                        description,
                        length: variation.length,
                        lengthUnit: variation.lengthUnit,
                        width: variation.width,
                        widthUnit: variation.widthUnit,
                        height: variation.height,
                        heightUnit: variation.heightUnit,
                        weight: variation.weight,
                        weightUnit: variation.weightUnit,
                    };
                    newProducts.push(variant);
                });
            }

            const body = {
                products: newProducts,
                categoryId: data.category,
            };

            const result = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const resultJSON = await result.json();

            if (result.status === 201) {
                console.log("SUCCESS!");
                toast.success("Product added!");
                methods.reset(initialFormValues);
            } else {
                console.log("Product Creation Error: ", resultJSON);
                toast.error("Error adding product, check console.");
            }
        } catch (err) {
            console.log("Product Creation Error: ", err);
        }
    };

    // state
    const [disabled, setDisabled] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    return (
        <FormProvider {...methods}>
            <form className='flex flex-col gap-8 mx-2 max-w-screen-md' onSubmit={methods.handleSubmit(onSubmit)}>
                <div className='flex gap-4 w-full'>
                    <ReactHookFormTextField name='sku' label='SKU' required fullWidth={false} />
                    <ReactHookFormTextField name='name' label='Name' required className='flex-grow' />
                </div>

                <Controller
                    name='category'
                    control={methods.control}
                    render={({ field }) => (
                        <FormControl className='flex w-full' required error={!!methods.formState.errors["category"]}>
                            <InputLabel id='category-label'>Category</InputLabel>
                            <Select
                                labelId='category-label'
                                label='Category *'
                                defaultValue={initialFormValues.category}
                                {...field}
                            >
                                {categories.map((cat: ProductCategory) => (
                                    <MenuItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </MenuItem>
                                ))}
                            </Select>
                            <FormHelperText>
                                {methods.formState.errors["category"]?.message?.toString() ?? ""}
                            </FormHelperText>
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
                                    <TextField
                                        label={`Variation ${index + 1} SKU`}
                                        placeholder='00'
                                        variant='outlined'
                                        required
                                        error={!!methods.formState.errors["variations"]?.[index]?.["sku"]}
                                        helperText={
                                            methods.formState.errors["variations"]?.[index]?.[
                                                "sku"
                                            ]?.message?.toString() ?? ""
                                        }
                                        disabled={disabled}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment className='mr-0' position='start'>
                                                    {`${watchSKU}-`}
                                                </InputAdornment>
                                            ),
                                        }}
                                        {...methods.register(`variations.${index}.sku` as const)}
                                    />

                                    <TextField
                                        className='flex-grow'
                                        label={`Variation ${index + 1} Name`}
                                        placeholder='16 inch'
                                        variant='outlined'
                                        required
                                        error={!!methods.formState.errors["variations"]?.[index]?.["name"]}
                                        helperText={
                                            methods.formState.errors["variations"]?.[index]?.[
                                                "name"
                                            ]?.message?.toString() ?? ""
                                        }
                                        disabled={disabled}
                                        fullWidth
                                        {...methods.register(`variations.${index}.name` as const)}
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
