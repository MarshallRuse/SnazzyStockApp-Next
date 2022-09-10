import { ReactNode } from "react";

type TabPanelProps = {
    children: ReactNode;
    value: number;
    index: number;
};

const TabPanel = ({ children, value, index, ...other }: TabPanelProps) => {
    return (
        <div
            className='overflow-y-auto rounded shadow-md flex flex-col flex-grow pb-4'
            role='tabpanel'
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <>{children}</>}
        </div>
    );
};

export default TabPanel;
