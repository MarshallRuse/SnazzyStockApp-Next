import { TextField } from "@mui/material";
import { ISaleWriteInFormValues } from "lib/interfaces/ISaleWriteInFormValues";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { SchemaOf, string, number, object, array } from "yup";

const SaleWriteInSchema: SchemaOf<ISaleWriteInFormValues> = object().shape(
    {
        sku: string().trim().when("name", {
            is: "",
            then: string().trim().required(),
            otherwise: string().trim(),
        }),
        name: string().trim().when("sku", {
            is: "",
            then: string().trim().required(),
            otherwise: string().trim(),
        }),
        salePrice: number().min(0, "Sale Price must be greater than 0").required(),
        quantity: number().min(1, "Quantity must be greater than 1").integer().required(),
    },
    //@ts-ignore
    ["sku", "name"]
);

const defaultFormValues = {
    sku: "",
    name: "",
    salePrice: 0,
    quantity: 1,
};

export default function SaleWriteInForm({ initialValues }) {
    const initialFormValues = initialValues ?? defaultFormValues;

    // react-hook-forms
    const methods = useForm({
        defaultValues: initialFormValues,
        resolver: yupResolver(SaleWriteInSchema),
    });
    const onSubmit = (data) => console.log(data);

    return (
        <form onSubmit={methods.handleSubmit(onSubmit)}>
            <div className='grid grid-cols-3 gap-2 bg-zinc-50 p-2'>
                <TextField
                    className='col-span-1 bg-white'
                    label={`SKU`}
                    placeholder='BBC-20'
                    variant='outlined'
                    error={!!methods.formState.errors["sku"]}
                    helperText={methods.formState.errors["sku"]?.message?.toString() ?? ""}
                    {...methods.register("sku")}
                />
                <TextField
                    className='col-span-2 bg-white'
                    label={`Name`}
                    placeholder='Figaro Chain'
                    variant='outlined'
                    error={!!methods.formState.errors["name"]}
                    helperText={methods.formState.errors["name"]?.message?.toString() ?? ""}
                    {...methods.register("name")}
                />
                <TextField
                    className='col-span-2 bg-white'
                    label={`Sale Price`}
                    placeholder='20.00'
                    variant='outlined'
                    error={!!methods.formState.errors["salePrice"]}
                    helperText={methods.formState.errors["salePrice"]?.message?.toString() ?? ""}
                    type='number'
                    {...methods.register("salePrice", { required: true, min: 0 })}
                />
                <TextField
                    className='col-span-1 bg-white'
                    label={`Quantity`}
                    placeholder='1'
                    variant='outlined'
                    error={!!methods.formState.errors["quantity"]}
                    helperText={methods.formState.errors["quantity"]?.message?.toString() ?? ""}
                    type='number'
                    {...methods.register("quantity", { required: true, min: 1 })}
                />
            </div>
        </form>
    );
}
