import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import * as Yup from "yup";
import MenuItem from "@mui/material/MenuItem";
import { Formik, Form, Field, FieldArray, useFormikContext } from "formik";
import { RadioGroup, Select, TextField } from "formik-mui";
import { FormControl, FormControlLabel, IconButton, Radio } from "@mui/material";

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

function ProductForm({
    categories = [],
    redirectPath = "",
    onSubmit = () => null,
    isSubmitting = false,
    isValid = false,
    dirty = false,
}) {
    console.log("categories in function ProductForm: ", categories);
    // formik
    const { values } = useFormikContext();
    // state
    const [disabled, setDisabled] = useState(false);

    return (
        <Form className='flex flex-col gap-8 mx-2 max-w-screen-md'>
            <div className='flex gap-4 w-full'>
                <Field
                    component={TextField}
                    id='sku'
                    name='sku'
                    label='SKU'
                    placeholder='XXX'
                    variant='outlined'
                    required
                    disabled={disabled}
                />

                <Field
                    className='flex-grow'
                    id='name'
                    name='name'
                    label='Name'
                    placeholder='Foxtail Bracelet'
                    variant='outlined'
                    required
                    disabled={disabled}
                />
            </div>

            <FormControl required className='flex w-full'>
                <Field
                    component={Select}
                    id='category'
                    name='category'
                    label='Category'
                    labelId='category-label'
                    required
                >
                    {categories.map((cat) => (
                        <MenuItem value={cat.id}>{cat.name}</MenuItem>
                    ))}
                </Field>
            </FormControl>

            <Field
                component={TextField}
                id='description'
                name='description'
                label='Description'
                placeholder='A foxy bracelet that will have you looking fire...'
                variant='outlined'
                multiline
                rows={4}
                disabled={disabled}
            />

            <hr className='border-t border-zinc-700' />
            <Field component={RadioGroup} row name='type'>
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
            </Field>

            {values.type === "SIMPLE" && (
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4 my-4'>
                    <Field
                        component={TextField}
                        id='length'
                        name='length'
                        label={`Length`}
                        type='number'
                        placeholder='16'
                        variant='outlined'
                        disabled={disabled}
                    />
                    <Field
                        component={TextField}
                        id='lengthUnit'
                        name='lengthUnit'
                        label={`Units`}
                        placeholder='inch'
                        variant='outlined'
                        disabled={disabled}
                    />
                    <Field
                        component={TextField}
                        id='width'
                        name='width'
                        label={`Width`}
                        type='number'
                        placeholder='16'
                        variant='outlined'
                        disabled={disabled}
                    />
                    <Field
                        component={TextField}
                        id='widthUnit'
                        name='widthUnit'
                        label={`Units`}
                        placeholder='inch'
                        variant='outlined'
                        disabled={disabled}
                    />
                    <Field
                        component={TextField}
                        id='height'
                        name='height'
                        label={`Height`}
                        type='number'
                        placeholder='16'
                        variant='outlined'
                        disabled={disabled}
                    />
                    <Field
                        component={TextField}
                        id='heightUnit'
                        name='heightUnit'
                        label={`Units`}
                        placeholder='inch'
                        variant='outlined'
                        disabled={disabled}
                    />
                    <Field
                        component={TextField}
                        id='weight'
                        name='weight'
                        label={`Weight`}
                        type='number'
                        placeholder='10'
                        variant='outlined'
                        disabled={disabled}
                    />
                    <Field
                        component={TextField}
                        id='weightUnit'
                        name='weightUnit'
                        label={`Units`}
                        placeholder='grams'
                        variant='outlined'
                        disabled={disabled}
                    />
                </div>
            )}
            {values.type === "VARIABLE" && (
                <FieldArray name='variations'>
                    {({ insert, remove, push }) => (
                        <div>
                            {console.log("values: ", values)}
                            {values.variations?.length > 0 &&
                                values.variations?.map((variation, index) => (
                                    <div key={`variation-${index + 1}`}>
                                        <p>Variation {index + 1}</p>
                                        <div className='flex gap-2'>
                                            <Field
                                                component={TextField}
                                                id={`variation-${index}-sku`}
                                                name={`variations.${index}.sku`}
                                                label={`Variation ${index + 1} SKU`}
                                                placeholder='XXX-00'
                                                variant='outlined'
                                                disabled={disabled}
                                            />
                                            <Field
                                                component={TextField}
                                                className='flex-grow'
                                                id={`variation-${index}-name`}
                                                name={`variations.${index}.name`}
                                                label={`Variation ${index + 1} Name`}
                                                placeholder='16 inch'
                                                variant='outlined'
                                                disabled={disabled}
                                            />
                                        </div>
                                        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 my-4'>
                                            <Field
                                                component={TextField}
                                                id={`variation-${index}-length`}
                                                name={`variations.${index}.length`}
                                                label={`Length`}
                                                type='number'
                                                placeholder='16'
                                                variant='outlined'
                                                disabled={disabled}
                                            />
                                            <Field
                                                component={TextField}
                                                id={`variation-${index}-lengthUnit`}
                                                name={`variations.${index}.lengthUnit`}
                                                label={`Units`}
                                                placeholder='inch'
                                                variant='outlined'
                                                disabled={disabled}
                                            />
                                            <Field
                                                component={TextField}
                                                id={`variation-${index}-width`}
                                                name={`variations.${index}.width`}
                                                label={`Width`}
                                                type='number'
                                                placeholder='16'
                                                variant='outlined'
                                                disabled={disabled}
                                            />
                                            <Field
                                                component={TextField}
                                                id={`variation-${index}-widthUnit`}
                                                name={`variations.${index}.widthUnit`}
                                                label={`Units`}
                                                placeholder='inch'
                                                variant='outlined'
                                                disabled={disabled}
                                            />
                                            <Field
                                                component={TextField}
                                                id={`variation-${index}-height`}
                                                name={`variations.${index}.height`}
                                                label={`Height`}
                                                type='number'
                                                placeholder='16'
                                                variant='outlined'
                                                disabled={disabled}
                                            />
                                            <Field
                                                component={TextField}
                                                id={`variation-${index}-heightUnit`}
                                                name={`variations.${index}.heightUnit`}
                                                label={`Units`}
                                                placeholder='inch'
                                                variant='outlined'
                                                disabled={disabled}
                                            />
                                            <Field
                                                component={TextField}
                                                id={`variation-${index}-weight`}
                                                name={`variations.${index}.weight`}
                                                label={`Weight`}
                                                type='number'
                                                placeholder='10'
                                                variant='outlined'
                                                disabled={disabled}
                                            />
                                            <Field
                                                component={TextField}
                                                id={`variation-${index}-weightUnit`}
                                                name={`variations.${index}.weightUnit`}
                                                label={`Units`}
                                                placeholder='grams'
                                                variant='outlined'
                                                disabled={disabled}
                                            />
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </FieldArray>
            )}
            <div className='flex justify-end'>
                <button
                    type='submit'
                    disabled={disabled || !isValid || !dirty}
                    className='bg-rose-600 text-white py-2 px-6 rounded-md focus:outline-none focus:ring-4 focus:ring-rose-600 focus:ring-opacity-50 hover:bg-rose-500 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-rose-600'
                >
                    {isSubmitting ? "Submitting..." : "Submit"}
                </button>
            </div>
        </Form>
    );
}

ProductFormFormikHOC.propTypes = {
    initialValues: PropTypes.shape({
        sku: PropTypes.string,
        name: PropTypes.string,
        category: PropTypes.string,
        description: PropTypes.string,
        type: PropTypes.string,
        image: PropTypes.string,
        length: PropTypes.number,
        lengthUnit: PropTypes.string,
        width: PropTypes.number,
        widthUnit: PropTypes.string,
        height: PropTypes.number,
        heightUnit: PropTypes.string,
        weight: PropTypes.number,
        weightUnit: PropTypes.string,
        variations: PropTypes.array,
    }),
    categories: PropTypes.array,
    redirectPath: PropTypes.string,
    onSubmit: PropTypes.func,
};

export default function ProductFormFormikHOC({
    initialValues = null,
    categories = [],
    redirectPath = "",
    onSubmit = () => null,
}) {
    console.log("categories in ProductFormFormikHOC: ", categories);
    // initial values
    const { ...initialFormValues } = initialValues ?? {
        sku: "",
        name: "",
        category: "",
        description: "",
        type: "SIMPLE",
        image: "",
        length: undefined,
        lengthUnit: "",
        width: undefined,
        widthUnit: "",
        height: undefined,
        heightUnit: "",
        weight: undefined,
        weightUnit: "",
        variations: [
            {
                sku: "",
                name: "",
                length: undefined,
                lengthUnit: "",
                width: undefined,
                widthUnit: "",
                height: undefined,
                heightUnit: "",
                weight: undefined,
                weightUnit: "",
            },
        ],
    };

    return (
        <Formik
            initialValues={initialFormValues}
            validationSchema={ProductSchema}
            validateOnBlur={false}
            onSubmit={onSubmit}
        >
            {({ isSubmitting, isValid, dirty }) => (
                <ProductForm
                    categories={categories}
                    onSubmit={onSubmit}
                    isSubmitting={isSubmitting}
                    isValid={isValid}
                    dirty={dirty}
                />
            )}
        </Formik>
    );
}
