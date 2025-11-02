import { Request, Response } from "express";
import { NotificationService } from "./notification.service";
import { StandardResponse, logger } from "../../utils";

class NotificationController {
    /**
     * Get all notifications for the authenticated user
     * GET /api/notifications
     */
    public static async getNotifications(req: Request, res: Response) {
        try {
            const userId = req.user!.id;
            const limit = parseInt(req.query.limit as string) || 50;
            const offset = parseInt(req.query.offset as string) || 0;

            logger.info("Get notifications endpoint called", {
                userId,
                limit,
                offset
            });

            const notifications = await NotificationService.getNotifications(
                userId,
                limit,
                offset
            );

            logger.info("Notifications retrieved successfully", {
                count: notifications.length
            });

            return StandardResponse.success(
                res,
                notifications,
                "Notifications retrieved successfully"
            );
        } catch (error: any) {
            logger.error("Error retrieving notifications", { error });
            return StandardResponse.internalServerError(
                res,
                "Failed to retrieve notifications",
                error
            );
        }
    }

    /**
     * Mark a notification as read
     * PATCH /api/notifications/:id/read
     */
    public static async markAsRead(req: Request, res: Response) {
        try {
            const userId = req.user!.id;
            const { id: notificationId } = req.params;

            logger.info("Mark notification as read endpoint called", {
                userId,
                notificationId
            });

            const notification = await NotificationService.markAsRead(
                notificationId,
                userId
            );

            if (!notification) {
                logger.warn("Notification not found", { notificationId });
                return StandardResponse.notFound(res, "Notification not found");
            }

            logger.info("Notification marked as read successfully", {
                notificationId
            });

            return StandardResponse.success(
                res,
                notification,
                "Notification marked as read"
            );
        } catch (error: any) {
            logger.error("Error marking notification as read", { error });
            return StandardResponse.internalServerError(
                res,
                "Failed to mark notification as read",
                error
            );
        }
    }

    /**
     * Mark all notifications as read for the authenticated user
     * PATCH /api/notifications/read-all
     */
    public static async markAllAsRead(req: Request, res: Response) {
        try {
            const userId = req.user!.id;

            logger.info("Mark all notifications as read endpoint called", {
                userId
            });

            const count = await NotificationService.markAllAsRead(userId);

            logger.info("All notifications marked as read", {
                count
            });

            return StandardResponse.success(
                res,
                { count },
                "All notifications marked as read"
            );
        } catch (error: any) {
            logger.error("Error marking all notifications as read", { error });
            return StandardResponse.internalServerError(
                res,
                "Failed to mark all notifications as read",
                error
            );
        }
    }

    /**
     * Get unread notification count for the authenticated user
     * GET /api/notifications/unread-count
     */
    public static async getUnreadCount(req: Request, res: Response) {
        try {
            const userId = req.user!.id;

            logger.info("Get unread count endpoint called", { userId });

            const count = await NotificationService.getUnreadCount(userId);

            logger.info("Unread count retrieved", { count });

            return StandardResponse.success(
                res,
                { count },
                "Unread count retrieved"
            );
        } catch (error: any) {
            logger.error("Error retrieving unread count", { error });
            return StandardResponse.internalServerError(
                res,
                "Failed to retrieve unread count",
                error
            );
        }
    }

    /**
     * Delete a notification
     * DELETE /api/notifications/:id
     */
    public static async deleteNotification(req: Request, res: Response) {
        try {
            const userId = req.user!.id;
            const { id: notificationId } = req.params;

            logger.info("Delete notification endpoint called", {
                userId,
                notificationId
            });

            const deleted = await NotificationService.deleteNotification(
                notificationId,
                userId
            );

            if (!deleted) {
                logger.warn("Notification not found", { notificationId });
                return StandardResponse.notFound(res, "Notification not found");
            }

            logger.info("Notification deleted successfully", {
                notificationId
            });

            return StandardResponse.success(
                res,
                null,
                "Notification deleted successfully"
            );
        } catch (error: any) {
            logger.error("Error deleting notification", { error });
            return StandardResponse.internalServerError(
                res,
                "Failed to delete notification",
                error
            );
        }
    }
}

export default NotificationController;

