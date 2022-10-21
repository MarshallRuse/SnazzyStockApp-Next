import { useState, useRef } from "react";
import ExampleTable from "components/tables/ExampleTable";
import { unstable_getServerSession } from "next-auth/next";
import { authOptions } from "pages/api/auth/[...nextauth]";
import type { UploadHeaderTransformation } from "lib/interfaces/UploadValueMaps";
import type { GetServerSideProps } from "next";
import UploadCSVInput from "components/UploadCSVInput";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import CancelRounded from "@mui/icons-material/CancelRounded";
import UploadResultsTable from "components/tables/UploadResultsTable";

export const getServerSideProps: GetServerSideProps = async (context) => {
    const session = await unstable_getServerSession(context.req, context.res, authOptions);
    if (!session) {
        return {
            redirect: {
                destination: "/",
                permanent: false,
            },
        };
    }

    return {
        props: {},
    };
};

export const HBCUploadHeaderValues: UploadHeaderTransformation[] = [
    { uploadKey: "Store/DC", outputKey: "StoreId" },
    { uploadKey: "Day", outputKey: "Date" },
    { uploadKey: "HBC Code", outputKey: "HBCCode" },
    {
        uploadKey: "Sales $",
        transformationFunction: (data) => {
            const val: string = data["Sales $"];
            return val.includes("$") ? parseFloat(val.split("$")[1]) : parseFloat(val);
        },
        outputKey: "SalesValue",
    },
    { uploadKey: "Sales U", outputKey: "Quantity" },
];

type ExampleUploadValue = {
    value: string | number | boolean;
};
// *ExampleBodyValues are dummy values for the InfoPanel explaining each upload,
// to give an example of what the data to be uploaded looks like
export const HBCUploadExampleBodyValues: ExampleUploadValue[][] = [
    [{ value: "1234" }, { value: "2022-07-15" }, { value: "HBC7 9 5" }, { value: "40" }, { value: "2" }],
    [{ value: "1234" }, { value: "2022-07-17" }, { value: "HBC22 22" }, { value: "88" }, { value: "1" }],
];

const AddHBCSalesPage = () => {
    const requiredHeadersRef = useRef(null);
    const [headersEstablished, setHeadersEstablished] = useState(false);
    const [missingHeaders, setMissingHeaders] = useState<string[]>([]);
    const [dataRows, setDataRows] = useState([]);
    const [uploadComplete, setUploadComplete] = useState(false);

    const processCSVFileRow = (results) => {
        const { data } = results;
        // only need to establish headers once
        let missedHeaders: string[];
        if (!headersEstablished) {
            missedHeaders = HBCUploadHeaderValues.filter(
                (headerVal) => headerVal.uploadKey && !results.meta.fields.includes(headerVal.uploadKey)
            ).map((val) => val.uploadKey);
            setHeadersEstablished(true);
            setMissingHeaders(missedHeaders);
        }

        const relevantData = {};

        // the headerValues array will either have an "uploadKey" property if the data exists in the uploaded file,
        // or "transformationFunction" to return some value if its a transformation of some other values
        HBCUploadHeaderValues.forEach((hvObj, index) => {
            relevantData[hvObj.outputKey] = hvObj.transformationFunction
                ? hvObj.transformationFunction(data)
                : data[hvObj.uploadKey];
        });

        console.log("relevantData: ", relevantData);

        setDataRows((oldDataRows) => [...oldDataRows, relevantData]);
    };

    const onProcessingComplete = () => {
        setUploadComplete(true);
        if (missingHeaders.length > 0) {
            requiredHeadersRef?.current?.scrollIntoView();
        }
    };

    const onFileRemoved = () => {
        setHeadersEstablished(false);
        setMissingHeaders([]);
        setDataRows([]);
        setUploadComplete(false);
    };

    return (
        <div className='grid grid-cols-12 gap-4 items-center'>
            <div className='col-span-12'>
                <h1>Add Sales - Hudson&apos;s Bay Company</h1>
            </div>
            <div className='col-span-12'>
                <UploadCSVInput
                    processCSVFileRow={processCSVFileRow}
                    onProcessingComplete={onProcessingComplete}
                    onFileRemoved={onFileRemoved}
                />
            </div>
            {uploadComplete && missingHeaders.length === 0 && (
                <div className='col-span-12'>
                    <UploadResultsTable headerValues={HBCUploadHeaderValues} bodyValues={dataRows} />
                </div>
            )}
            <div className='col-span-12 mt-8 p-4 bg-zinc-50'>
                <h2>Upload Instructions</h2>
                <p>The file uploaded must be a CSV file (i.e., ".csv" file extension).</p>
                <p ref={requiredHeadersRef}>The data must include the following headers*:</p>
                <ul className='columns-4 mb-8 snazzyList blueList'>
                    {HBCUploadHeaderValues.filter((hv) => hv.uploadKey).map((hv) => (
                        <li className={`flex items-center gap-2`} key={`headers-required-${hv.uploadKey}`}>
                            {hv.uploadKey}
                            {headersEstablished && missingHeaders.includes(hv.uploadKey) && (
                                <span className='text-red-500'>
                                    <CancelRounded />
                                </span>
                            )}
                            {headersEstablished && !missingHeaders.includes(hv.uploadKey) && (
                                <span className='text-green-500'>
                                    <CheckCircleRounded />
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
                <small>
                    <em>*other headers may be included, but the following are the only ones that will be looked at.</em>
                </small>
                <p>Together with values it will look something like this:</p>
                <ExampleTable headerValues={HBCUploadHeaderValues} bodyValues={HBCUploadExampleBodyValues} />
            </div>
        </div>
    );
};

export default AddHBCSalesPage;
