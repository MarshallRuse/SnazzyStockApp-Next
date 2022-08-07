import { ChangeEvent } from "react";
import SearchIcon from "@mui/icons-material/Search";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";

const SearchBar = ({
    searchLabel,
    searchVal,
    searchControl,
}: {
    searchLabel: string;
    searchVal: string;
    searchControl: (s: string) => void;
}) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
        searchControl(event.target.value);
    };

    return (
        <TextField
            id='outlined-basic'
            className='w-full'
            label={searchLabel}
            variant='outlined'
            InputProps={{
                startAdornment: (
                    <InputAdornment position='start'>
                        <SearchIcon />
                    </InputAdornment>
                ),
            }}
            onChange={handleChange}
            value={searchVal}
        />
    );
};

export default SearchBar;
