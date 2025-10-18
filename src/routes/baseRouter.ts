import { Router } from "express";
import { AuthMiddleware, logger, StandardResponse } from "../utils";
import { authRouter } from "../modules/auth";
import { mediaRouter } from "../modules/media";
import { profileRouter } from "../modules/profiles";

class BaseRouter {
    private readonly router: Router = Router();

    constructor() {
        this.setupRoutes();
    }

    public getRouter(): Router {
        return this.router;
    }

    public setupRoutes(): void {
        this.router.get('/health', (req, res) => {
            logger.info('Health check endpoint hit');
            return StandardResponse.success(res, { status: 'ok' });
        });

        this.router.use('/auth', authRouter);
        this.router.use(AuthMiddleware.authenticate())
        this.router.use('/media', mediaRouter);
        this.router.use('/profiles', profileRouter);
    }
}

export default new BaseRouter();