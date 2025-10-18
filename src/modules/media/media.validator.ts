import { Schema } from "express-validator";

export class MediaValidator {
    /**
     * Custom validator to check if file is uploaded
     */
    public static validateFileUpload = (value: any, { req }: any) => {
        if (!req.file) {
            throw new Error("No file uploaded");
        }
        return true;
    };

    /**
     * Custom validator to check file type
     */
    public static validateFileType = (value: any, { req }: any) => {
        if (!req.file) {
            return true; // File validation handled by multer
        }

        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
        const extname = allowedTypes.test(req.file.originalname.toLowerCase());
        const mimetype = allowedTypes.test(req.file.mimetype);

        if (!mimetype || !extname) {
            throw new Error("Only images and documents are allowed");
        }
        return true;
    };

    /**
     * Custom validator to check file size
     */
    public static validateFileSize = (value: any, { req }: any) => {
        if (!req.file) {
            return true; // File validation handled by multer
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (req.file.size > maxSize) {
            throw new Error("File size must be less than 10MB");
        }
        return true;
    };

    // ----- Schemas -----
    public static uploadSchema: Schema = {
        file: {
            custom: {
                options: MediaValidator.validateFileUpload,
                errorMessage: "File is required",
            },
        },
        fileType: {
            custom: {
                options: MediaValidator.validateFileType,
                errorMessage: "Invalid file type",
            },
        },
        fileSize: {
            custom: {
                options: MediaValidator.validateFileSize,
                errorMessage: "File size exceeds limit",
            },
        },
    };
}
