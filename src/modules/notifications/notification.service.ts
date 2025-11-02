import { DatabaseConnection } from "../../database/DatabaseConnection";
import { logger } from "../../utils";

export class NotificationService {
    /**
     * Get all notifications for a user
     * @param userId - ID of the user
     * @param limit - Maximum number of notifications to return (default: 50)
     * @param offset - Number of notifications to skip (default: 0)
     * @returns Array of notifications
     */
    static async getNotifications(userId: string, limit: number = 50, offset: number = 0) {
        const query = `
            SELECT 
                n.id,
                n.user_id,
                n.sender_id,
                n.type,
                n.message,
                n.is_read,
                n.created_at,
                u.username as sender_username,
                u.profile_image_url as sender_profile_image_url
            FROM notifications n
            LEFT JOIN users u ON n.sender_id = u.id
            WHERE n.user_id = $1
            ORDER BY n.created_at DESC
            LIMIT $2 OFFSET $3
        `;
        
        const result = await DatabaseConnection.query(query, [userId, limit, offset]);
        return result.rows;
    }

    /**
     * Get notification by ID
     * @param notificationId - ID of the notification
     * @param userId - ID of the user (for authorization)
     * @returns Notification record or null if not found
     */
    static async getNotificationById(notificationId: string, userId: string) {
        const query = `
            SELECT 
                n.id,
                n.user_id,
                n.sender_id,
                n.type,
                n.message,
                n.is_read,
                n.created_at,
                u.username as sender_username,
                u.profile_image_url as sender_profile_image_url
            FROM notifications n
            LEFT JOIN users u ON n.sender_id = u.id
            WHERE n.id = $1 AND n.user_id = $2
        `;
        
        const result = await DatabaseConnection.query(query, [notificationId, userId]);
        return result.rows[0] || null;
    }

    /**
     * Mark a notification as read
     * @param notificationId - ID of the notification
     * @param userId - ID of the user (for authorization)
     * @returns Updated notification record
     */
    static async markAsRead(notificationId: string, userId: string) {
        const query = `
            UPDATE notifications
            SET is_read = true
            WHERE id = $1 AND user_id = $2
            RETURNING *
        `;
        
        const result = await DatabaseConnection.query(query, [notificationId, userId]);
        return result.rows[0] || null;
    }

    /**
     * Mark all notifications as read for a user
     * @param userId - ID of the user
     * @returns Number of notifications marked as read
     */
    static async markAllAsRead(userId: string) {
        const query = `
            UPDATE notifications
            SET is_read = true
            WHERE user_id = $1 AND is_read = false
            RETURNING id
        `;
        
        const result = await DatabaseConnection.query(query, [userId]);
        return result.rowCount || 0;
    }

    /**
     * Get unread notification count for a user
     * @param userId - ID of the user
     * @returns Number of unread notifications
     */
    static async getUnreadCount(userId: string): Promise<number> {
        const query = `
            SELECT COUNT(*) as count
            FROM notifications
            WHERE user_id = $1 AND is_read = false
        `;
        
        const result = await DatabaseConnection.query(query, [userId]);
        return parseInt(result.rows[0].count) || 0;
    }

    /**
     * Delete a notification
     * @param notificationId - ID of the notification
     * @param userId - ID of the user (for authorization)
     * @returns Boolean indicating success
     */
    static async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
        const query = `
            DELETE FROM notifications
            WHERE id = $1 AND user_id = $2
        `;
        
        const result = await DatabaseConnection.query(query, [notificationId, userId]);
        return (result.rowCount || 0) > 0;
    }
}

