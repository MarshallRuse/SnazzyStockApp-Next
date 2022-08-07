import { FC } from "react";
import { TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";

interface IReactHookFormTextFieldProps {
    label: string;
    name: string;
    disabled?: boolean;
    textArea?: boolean;
    rows?: number;
    type?: string;
    placeholder?: string;
}

const ReactHookFormTextField: FC<IReactHookFormTextFieldProps> = ({
    label,
    name,
    disabled = false,
    textArea = false,
    rows = 4,
    type = "text",
    placeholder = "",
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
            error={!!errors[name]}
            helperText={errors[name]?.message?.toString() ?? ""}
            fullWidth
            multiline={textArea}
            rows={rows}
            type={type}
            placeholder={placeholder}
            {...rest}
            {...register(name)}
        />
    );
};

export default ReactHookFormTextField;
