import { Request, Response } from "express";
import { MediaBL } from "../../businessLayer";
import { logger, StandardResponse } from "../../utils";
import { MulterRequest } from "./types";

class MediaController {
    public static async upload(req: MulterRequest, res: Response) {
        logger.info("File upload endpoint called", { 
            filename: req.file?.originalname,
            size: req.file?.size,
            userId: req.user?.id // Log authenticated user ID
        });

        try {
            if (!req.file) {
                logger.warn("No file uploaded");
                return StandardResponse.badRequest(res, "No file uploaded");
            }

            // Ensure user is authenticated (this should be handled by middleware, but extra safety)
            if (!req.user) {
                logger.warn("File upload attempted without authentication");
                return StandardResponse.unauthorized(res, "Authentication required");
            }

            logger.debug("Processing file upload", { 
                filename: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                userId: req.user.id
            });

            // Use business layer to process the file upload with user context
            const uploadResponse = await MediaBL.processFileUpload(req.file, req.user.id);

            logger.info("File uploaded successfully", { 
                url: uploadResponse.url,
                userId: req.user.id 
            });
            return StandardResponse.success(res, uploadResponse.url, "File uploaded successfully");
        } catch (error) {
            logger.error("File upload failed", { 
                error,
                userId: req.user?.id 
            });
            return StandardResponse.internalServerError(res, "Failed to upload file", error);
        }
    }
}

export default MediaController;