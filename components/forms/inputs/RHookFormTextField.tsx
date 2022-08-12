import { FC } from "react";
import { TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";

interface IReactHookFormTextFieldProps {
    label: string;
    name: string;
    required?: boolean;
    disabled?: boolean;
    textArea?: boolean;
    rows?: number;
    type?: string;
    placeholder?: string;
    fullWidth?: boolean;
    className?: string;
}

const ReactHookFormTextField: FC<IReactHookFormTextFieldProps> = ({
    label,
    name,
    required = false,
    disabled = false,
    textArea = false,
    rows = 4,
    type = "text",
    placeholder = "",
    fullWidth = true,
    className = "",
    ...rest
}: IReactHookFormTextFieldProps) => {
    const {
        register,
        formState: { errors },
    } = useFormContext();

    return (
        <TextField
            label={label}
            variant='outlined'
            required={required}
            error={!!errors[name]}
            helperText={errors[name]?.message?.toString() ?? ""}
            fullWidth={fullWidth}
            multiline={textArea}
            rows={rows}
            type={type}
            placeholder={placeholder}
            className={className}
            {...rest}
            {...register(name)}
        />
    );
};

export default ReactHookFormTextField;
