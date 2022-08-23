import { useEffect, useLayoutEffect, useState } from "react";
import { Html5Qrcode, Html5QrcodeScanType, Html5QrcodeScannerState } from "html5-qrcode";
import styles from "../styles/Scanner.module.scss";
import { IconButton } from "@mui/material";
import Cancel from "@mui/icons-material/Cancel";
import CheckCircle from "@mui/icons-material/CheckCircle";
import { Html5QrcodeResult } from "html5-qrcode/esm/core";

type ScannerProps = {
    scannerOn: boolean;
    fps?: number;
    qrbox?: number | { width: number; height: number };
    disableFlip?: boolean;
    verbose?: boolean;
    aspectRatio?: number;
    qrCodeSuccessCallback: () => void;
};

const Scanner = ({
    scannerOn = false,
    fps = 10,
    qrbox = { width: 250, height: 150 },
    disableFlip = false,
    verbose = true,
    aspectRatio = 1,
    qrCodeSuccessCallback,
}: ScannerProps) => {
    const [codeText, setCodeText] = useState("");
    const [html5QrCode, setHtml5QrCode] = useState(null);

    const qrcodeRegionId = "html5-qrcode";

    const onScanSuccess = (decodedText: string, decodedResult: Html5QrcodeResult) => {
        // handle the scanned code as you like, for example:
        console.log(`Code matched = ${decodedText}`, decodedResult);
        if (decodedText !== codeText) {
            setCodeText(decodedText);
        }
    };

    const onScanFailure = (error: string) => {
        // handle scan failure, usually better to ignore and keep scanning.
        // for example:
        //console.warn(`Code scan error = ${error}`);
    };

    const turnScannerOff = () => {
        if (html5QrCode?.getState() !== Html5QrcodeScannerState.NOT_STARTED) {
            html5QrCode
                ?.stop()
                .then(() => {
                    html5QrCode.clear();
                })
                .catch((error: string) => {
                    console.error("Failed to clear html5QrcodeScanner. ", error);
                });
        }
        // Not enough to stop the scanner, navigator still registers userMedia stream as on
        navigator?.mediaDevices
            .getUserMedia({ audio: false, video: true })
            .then((stream) => {
                stream.getTracks().forEach((track) => {
                    console.log("track: ", track);
                    track.stop();
                });
            })
            .catch((err) => console.log("getUserMedia Error: ", err));
    };

    useLayoutEffect(() => {
        const getCameras = async (): Promise<string> => {
            try {
                const devices = await Html5Qrcode.getCameras();
                if (devices && devices.length) {
                    const cameraId = devices[0].id;
                    return cameraId;
                }
            } catch (err) {
                console.log("Scanner getCameras Error: ", err);
            }
        };

        const config = {
            fps,
            qrbox,
            aspectRatio,
            disableFlip,
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        };

        // Success callback is required.
        if (!qrCodeSuccessCallback) {
            throw "qrCodeSuccessCallback is required callback.";
        }

        if (scannerOn) {
            try {
                //const cameraId = getCameras();
                const instance = new Html5Qrcode(qrcodeRegionId);
                instance.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure);
                setHtml5QrCode(instance);
            } catch (err) {
                console.log("Scanner initialization Error:", err);
            }
        } else {
            turnScannerOff();
        }
    }, [scannerOn]);

    useEffect(() => {
        console.log("render!!!!!!");
        return () => {
            console.log("Unmounting Scanner");
            turnScannerOff();
        };
    }, []);

    return (
        <div className='relative mt-2'>
            <div id={qrcodeRegionId} className='absolute top-0 bottom-0 left-0 right-0' />
            <div className='absolute bottom-2 left-0 right-0 flex text-white w-full'>
                <IconButton size='large' color='secondary'>
                    <Cancel />
                </IconButton>
                <div className='flex-grow text-center'>{codeText ? codeText : "No Code Detected"}</div>
                <IconButton size='large' color='primary'>
                    <CheckCircle />
                </IconButton>
            </div>
        </div>
    );
};

export default Scanner;
