import { Router } from "express";
import { logger } from "../utils";

class BaseRouter {
    private static router: Router = Router();
    
    constructor() {
        this.setupRoutes();
    }

    public static getRouter(): Router {
        return BaseRouter.router;
    }

    public setupRoutes(): void {
        BaseRouter.router.get('/health', (req, res) => {
            logger.info('Health check endpoint hit');
            res.status(200).json({ status: 'ok' });
        });
    }
}

export default BaseRouter;