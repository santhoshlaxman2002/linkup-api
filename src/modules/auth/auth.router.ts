import { Router, Request, Response } from "express";
import { Validator } from "../../middleware/validate";
import { AuthValidator } from "./auth.validator";
import { StandardResponse } from "../../utils";
import AuthController from "./auth.controller";

class AuthRouter {
    public router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(
            "/register",
            Validator.validate(AuthValidator.registerSchema),
            AuthController.register
        );
        this.router.post(
            "/login",
            Validator.validate(AuthValidator.loginSchema),
            AuthController.login
        );
        this.router.post(
            "/generate-username",
            Validator.validate(AuthValidator.generateUsernameSchema),
            AuthController.generateUsername
        );
        this.router.post(
            "/validate-username",
            Validator.validate(AuthValidator.validateUsernameSchema),
            AuthController.validateUsername
        )
    }

}

export default new AuthRouter().router;
