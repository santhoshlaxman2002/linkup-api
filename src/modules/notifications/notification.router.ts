import { Router } from "express";
import NotificationController from "./notification.controller";

class NotificationRouter {
    public router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes() {
        // Get all notifications
        this.router.get(
            "/",
            NotificationController.getNotifications
        );

        // Mark a notification as read
        this.router.patch(
            "/:id/read",
            NotificationController.markAsRead
        );

        // Mark all notifications as read
        this.router.patch(
            "/read-all",
            NotificationController.markAllAsRead
        );

        // Get unread notification count
        this.router.get(
            "/unread-count",
            NotificationController.getUnreadCount
        );

        // Delete a notification
        this.router.delete(
            "/:id",
            NotificationController.deleteNotification
        );
    }
}

export default new NotificationRouter().router;

