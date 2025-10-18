import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Validator } from "../../middleware/validate";
import { MediaValidator } from "./media.validator";
import MediaController from "./media.controller";
import { StandardResponse, logger, AuthMiddleware } from "../../utils";

class MediaRouter {
    public router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes() {
        // Protected route - requires authentication
        this.router.post(
            "/upload",
            this.setupMulter(),
            this.handleMulterErrors(),
            Validator.validate(MediaValidator.uploadSchema),
            MediaController.upload
        );
    }

    private setupMulter() {
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), "uploads");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Configure multer for file uploads
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, uploadsDir);
            },
            filename: (req, file, cb) => {
                // Generate unique filename with timestamp
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
            }
        });

        // File filter to allow only certain file types
        const fileFilter = (req: any, file: any, cb: any) => {
            // Allow images and common document types
            const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
            const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = allowedTypes.test(file.mimetype);

            if (mimetype && extname) {
                return cb(null, true);
            } else {
                cb(new Error('Only images and documents are allowed!'));
            }
        };

        return multer({
            storage: storage,
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB limit
            },
            fileFilter: fileFilter
        }).single("file");
    }

    private handleMulterErrors() {
        return (err: any, req: any, res: any, next: any): void => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    logger.warn("File upload failed: File too large", { 
                        error: err.message,
                        code: err.code 
                    });
                    StandardResponse.badRequest(res, 'File too large. Maximum size is 10MB.');
                    return;
                }
                logger.warn("File upload failed: Multer error", { 
                    error: err.message,
                    code: err.code 
                });
                StandardResponse.badRequest(res, err.message);
                return;
            } else if (err) {
                logger.warn("File upload failed: General error", { 
                    error: err.message 
                });
                StandardResponse.badRequest(res, err.message);
                return;
            }
            next();
        };
    }
}

export default new MediaRouter().router;
