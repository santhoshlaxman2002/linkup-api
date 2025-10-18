import { Router } from "express";
import { Validator } from "../../middleware/validate";
import { ProfileValidator } from "./profile.validator";
import ProfileController from "./profile.controller";
import { logger } from "../../utils";

class ProfileRouter {
    public router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes() {
        // Get current user's profile - requires authentication
        this.router.get(
            "/",
            ProfileController.getProfile
        );

        // Update current user's profile - requires authentication
        this.router.put(
            "/",
            Validator.validate(ProfileValidator.updateProfileSchema),
            ProfileController.updateProfile
        );
    }
}

export default new ProfileRouter().router;
