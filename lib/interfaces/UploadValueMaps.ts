export type SingleKeyUpload = {
    uploadKey: string;
    transformationFunction?: (data: string) => string | number | boolean;
    outputKey: string;
};

export type MultiKeyUpload = {
    uploadKey?: undefined;
    uploadKeys: string[];
    transformationFunction: (data: string) => string | number | boolean;
    outputKey: string;
};

export type UploadHeaderTransformation = SingleKeyUpload | MultiKeyUpload;
