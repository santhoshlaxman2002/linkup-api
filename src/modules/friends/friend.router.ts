import { Router } from "express";
import { Validator } from "../../middleware/validate";
import { FriendValidator } from "./friend.validator";
import FriendController from "./friend.controller";

class FriendRouter {
    public router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes() {
        // Send friend request
        this.router.post(
            "/request",
            Validator.validate(FriendValidator.requestFriendSchema),
            FriendController.sendRequest
        );

        // Accept friend request
        this.router.post(
            "/accept/:id",
            Validator.validate(FriendValidator.friendRequestIdSchema),
            FriendController.acceptRequest
        );

        // Reject friend request
        this.router.post(
            "/reject/:id",
            Validator.validate(FriendValidator.friendRequestIdSchema),
            FriendController.rejectRequest
        );

        // Cancel friend request
        this.router.post(
            "/cancel/:id",
            Validator.validate(FriendValidator.friendRequestIdSchema),
            FriendController.cancelRequest
        );

        // Unfriend
        this.router.delete(
            "/:id",
            Validator.validate(FriendValidator.friendRequestIdSchema),
            FriendController.unfriend
        );

        // Get all friends
        this.router.get(
            "/",
            FriendController.getFriends
        );

        // Get incoming requests
        this.router.get(
            "/requests",
            FriendController.getIncomingRequests
        );

        // Get outgoing requests
        this.router.get(
            "/sent",
            FriendController.getOutgoingRequests
        );
    }
}

export default new FriendRouter().router;

