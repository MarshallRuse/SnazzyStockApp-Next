import { useRef, useState } from "react";
import Papa from "papaparse";
import CTAButton from "./CTAButton";

// type UploadCSVInput = {
//     onFileSelect:
// }

const UploadCSVInput = ({ processCSVFileRow, onProcessingComplete, onFileRemoved }) => {
    const fileInputRef = useRef(null);
    const [fileName, setFileName] = useState("");

    const handleFileChange = (event) => {
        const fileObj = event.target.files?.[0];
        if (!fileObj) {
            return;
        }
        console.log("fileObj: ", fileObj);

        event.target.value = null;

        setFileName(fileObj.name);

        Papa.parse(fileObj, {
            header: true,
            skipEmptyLines: true,
            step: processCSVFileRow,
            complete: onProcessingComplete,
        });
    };

    const simulateInputClick = () => fileInputRef.current?.click();

    const removeFile = (event) => {
        event.target.value = null;
        setFileName("");
        onFileRemoved();
    };

    return (
        <>
            <input ref={fileInputRef} type='file' accept='.csv' onChange={handleFileChange} className='hidden' />
            <div className='flex w-full justify-center gap-4'>
                <div
                    className={` border-2 border-zinc-200 rounded-md flex items-center justify-end px-4 transition scale-x-0 ${
                        fileName !== "" && "flex-grow scale-x-100"
                    }`}
                >
                    {fileName}
                </div>
                <CTAButton
                    onClick={fileName === "" ? simulateInputClick : removeFile}
                    heavyRounding={false}
                    color={fileName === "" ? "primary" : "secondary"}
                >
                    {fileName === "" ? "Upload" : "Remove"}
                </CTAButton>
            </div>
        </>
    );
};

export default UploadCSVInput;
