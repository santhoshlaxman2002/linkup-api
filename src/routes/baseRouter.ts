import { Router } from "express";
import { logger, StandardResponse } from "../utils";
import { authRouter } from "../modules/auth";

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
    }
}

export default new BaseRouter();