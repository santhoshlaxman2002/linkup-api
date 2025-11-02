import { Router } from "express";
import UserController from "./user.controller";

class UserRouter {
    public router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes() {
        // Search users
        this.router.get("/search", UserController.searchUsers);
    }
}

export default new UserRouter().router;

