import { Router } from "express";
import UserController from "./user.controller";
import { UserValidator } from "./user.validator";
import { Validator } from "../../middleware/validate";

class UserRouter {
    public router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes() {
        // Search users
        this.router.get("/search", UserController.searchUsers);
        // Get recent user searches
        this.router.get("/recent-searches",
            Validator.validate(UserValidator.getRecentUserSearchesSchema),
            UserController.getRecentUserSearches);

        this.router.delete("/recent-searches",
            UserController.deleteAllRecentUserSearches);

        this.router.delete("/recent-searches/:searchedUserId",
            Validator.validate(UserValidator.deleteRecentUserSearchSchema),
            UserController.deleteRecentUserSearch);
    }
}

export default new UserRouter().router;

