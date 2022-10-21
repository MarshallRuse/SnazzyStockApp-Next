import { Tooltip, tooltipClasses } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { CSSProperties, ReactElement } from "react";

const WrappingTooltip = styled(
    ({
        title,
        className,
        children,
        style,
    }: {
        title: string;
        className?: string;
        style?: CSSProperties;
        children: ReactElement;
    }) => (
        <Tooltip style={style} title={title} classes={{ popper: className }}>
            {children}
        </Tooltip>
    )
)(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
        lineHeight: "1.5em",
        maxWidth: "fit-content",
        whiteSpace: "pre",
    },
}));

export default WrappingTooltip;
