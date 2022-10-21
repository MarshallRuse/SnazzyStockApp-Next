import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { periods } from "lib/interfaces/Periods";

type TimePeriodSelectProps = {
    period: typeof periods[number];
    onPeriodChange: (p: string) => void;
};

export default function TimePeriodSelect({ period, onPeriodChange }: TimePeriodSelectProps) {
    const handleChange = (event: SelectChangeEvent) => {
        onPeriodChange(event.target.value as string);
    };

    return (
        <Box sx={{ minWidth: 120 }}>
            <FormControl fullWidth>
                <InputLabel id='time-period-select-label'>Period</InputLabel>
                <Select
                    labelId='time-period-select-label'
                    id='time-period-select'
                    value={period}
                    label='Period'
                    onChange={handleChange}
                    sx={{ backgroundColor: "white" }}
                >
                    {periods.map((p) => (
                        <MenuItem key={`time-period-select-option-${p}`} value={p}>
                            {p}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
}
