import { imageKit, logger } from "../utils";
import fs from "fs";
import { MulterFile } from "../modules/media/types";

export class MediaBL {
    /**
     * Upload file to ImageKit cloud storage
     * @param file - The uploaded file from multer
     * @returns Promise with upload response from ImageKit
     */
    static async uploadFileToImageKit(file: MulterFile): Promise<any> {
        try {
            logger.debug("Reading file buffer for ImageKit upload", { 
                filename: file.originalname, 
                size: file.size 
            });

            const fileBuffer = fs.readFileSync(file.path);
            const fileBase64 = fileBuffer.toString("base64");

            logger.debug("Uploading file to ImageKit", { 
                filename: file.originalname,
                folder: "/uploads"
            });

            // Upload to ImageKit
            const uploadResponse = await imageKit.upload({
                file: fileBase64,
                fileName: file.originalname,
                folder: "/uploads",
            });

            logger.debug("ImageKit upload response", { uploadResponse });
            return uploadResponse;
        } catch (error) {
            logger.error("Failed to upload file to ImageKit", { 
                error, 
                filename: file.originalname 
            });
            throw error;
        }
    }

    /**
     * Clean up temporary file from local storage
     * @param filePath - Path to the temporary file
     */
    static async cleanupTempFile(filePath: string): Promise<void> {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                logger.debug("Temporary file cleaned up", { filePath });
            }
        } catch (error) {
            logger.error("Failed to delete temporary file", { error, filePath });
            throw error;
        }
    }

    /**
     * Validate file type and size
     * @param file - The uploaded file
     * @returns boolean indicating if file is valid
     */
    static validateFile(file: MulterFile): { isValid: boolean; error?: string } {
        // Check file type
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
        const extname = allowedTypes.test(file.originalname.toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (!mimetype || !extname) {
            return {
                isValid: false,
                error: "Only images and documents are allowed"
            };
        }

        // Check file size (10MB limit)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return {
                isValid: false,
                error: "File size must be less than 10MB"
            };
        }

        return { isValid: true };
    }

    /**
     * Process file upload: validate, upload to ImageKit, and cleanup
     * @param file - The uploaded file
     * @param userId - ID of the user uploading the file
     * @returns Promise with upload response
     */
    static async processFileUpload(file: MulterFile, userId: string): Promise<any> {
        try {
            logger.debug("Starting file upload process", { 
                userId, 
                filename: file.originalname,
                size: file.size 
            });

            // Validate file
            const validation = this.validateFile(file);
            if (!validation.isValid) {
                throw new Error(validation.error);
            }

            // Upload to ImageKit
            const uploadResponse = await this.uploadFileToImageKit(file);

            // Clean up temporary file
            await this.cleanupTempFile(file.path);

            logger.info("File processed successfully", { 
                url: uploadResponse.url,
                filename: file.originalname,
                userId 
            });

            return uploadResponse;
        } catch (error) {
            // Clean up temporary file in case of error
            try {
                await this.cleanupTempFile(file.path);
            } catch (cleanupError) {
                logger.error("Failed to cleanup file after error", { 
                    cleanupError, 
                    originalError: error 
                });
            }
            throw error;
        }
    }
}
