// Shared types for media module
export interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
}

export type MulterRequest = import("express").Request & {
    file?: MulterFile;
};
