import { DatabaseConnection } from "../database/DatabaseConnection";
import { logger } from "../utils";

export class FriendsBL {
    /**
     * Get all accepted friendships for a user
     * @param userId - ID of the user
     * @returns Array of friendship records with friend details
     */
    static async getAcceptedFriendships(userId: string) {
        const query = `
            SELECT 
                f.id,
                f.requester_id,
                f.receiver_id,
                f.created_at,
                f.updated_at,
                CASE 
                    WHEN f.requester_id = $1 THEN u_receiver.id
                    ELSE u_requester.id
                END as friend_id,
                CASE 
                    WHEN f.requester_id = $1 THEN u_receiver.username
                    ELSE u_requester.username
                END as friend_username,
                CASE 
                    WHEN f.requester_id = $1 THEN u_receiver.first_name
                    ELSE u_requester.first_name
                END as friend_first_name,
                CASE 
                    WHEN f.requester_id = $1 THEN u_receiver.last_name
                    ELSE u_requester.last_name
                END as friend_last_name,
                CASE 
                    WHEN f.requester_id = $1 THEN u_receiver.profile_image_url
                    ELSE u_requester.profile_image_url
                END as friend_profile_image_url
            FROM friendships f
            LEFT JOIN users u_requester ON f.requester_id = u_requester.id AND u_requester.is_verified = true
            LEFT JOIN users u_receiver ON f.receiver_id = u_receiver.id AND u_receiver.is_verified = true
            WHERE (f.requester_id = $1 OR f.receiver_id = $1)
                AND f.status = 'accepted'
            ORDER BY f.updated_at DESC
        `;
        
        const result = await DatabaseConnection.query(query, [userId]);
        return result.rows;
    }

    /**
     * Get pending friend requests received by a user
     * @param userId - ID of the user
     * @returns Array of pending incoming friend requests
     */
    static async getIncomingPendingRequests(userId: string) {
        const query = `
            SELECT 
                f.id,
                f.requester_id,
                f.created_at,
                u.username as requester_username,
                u.first_name as requester_first_name,
                u.last_name as requester_last_name,
                u.profile_image_url as requester_profile_image_url
            FROM friendships f
            JOIN users u ON f.requester_id = u.id AND u.is_verified = true
            WHERE f.receiver_id = $1
                AND f.status = 'pending'
            ORDER BY f.created_at DESC
        `;
        
        const result = await DatabaseConnection.query(query, [userId]);
        return result.rows;
    }

    /**
     * Get pending friend requests sent by a user
     * @param userId - ID of the user
     * @returns Array of pending outgoing friend requests
     */
    static async getOutgoingPendingRequests(userId: string) {
        const query = `
            SELECT 
                f.id,
                f.receiver_id,
                f.created_at,
                u.username as receiver_username,
                u.first_name as receiver_first_name,
                u.last_name as receiver_last_name,
                u.profile_image_url as receiver_profile_image_url
            FROM friendships f
            JOIN users u ON f.receiver_id = u.id AND u.is_verified = true
            WHERE f.requester_id = $1
                AND f.status = 'pending'
            ORDER BY f.created_at DESC
        `;
        
        const result = await DatabaseConnection.query(query, [userId]);
        return result.rows;
    }

    /**
     * Get a specific friendship by ID
     * @param friendshipId - ID of the friendship
     * @returns Friendship record or null if not found
     */
    static async getFriendshipById(friendshipId: string) {
        const query = `
            SELECT 
                f.id,
                f.requester_id,
                f.receiver_id,
                f.status,
                f.created_at,
                f.updated_at
            FROM friendships f
            WHERE f.id = $1
        `;
        
        const result = await DatabaseConnection.query(query, [friendshipId]);
        return result.rows[0] || null;
    }

    /**
     * Check if a friendship exists between two users
     * @param userId1 - First user ID
     * @param userId2 - Second user ID
     * @returns Friendship record or null if not found
     */
    static async getFriendshipBetweenUsers(userId1: string, userId2: string) {
        const query = `
            SELECT 
                f.id,
                f.requester_id,
                f.receiver_id,
                f.status,
                f.created_at,
                f.updated_at
            FROM friendships f
            WHERE (f.requester_id = $1 AND f.receiver_id = $2)
               OR (f.requester_id = $2 AND f.receiver_id = $1)
        `;
        
        const result = await DatabaseConnection.query(query, [userId1, userId2]);
        return result.rows[0] || null;
    }

    /**
     * Create a new friend request
     * @param requesterId - ID of the user sending the request
     * @param receiverId - ID of the user receiving the request
     * @returns Created friendship record
     */
    static async createFriendRequest(requesterId: string, receiverId: string) {
        const query = `
            INSERT INTO friendships (requester_id, receiver_id, status)
            VALUES ($1, $2, 'pending')
            RETURNING *
        `;
        
        const result = await DatabaseConnection.query(query, [requesterId, receiverId]);
        return result.rows[0];
    }

    /**
     * Update friendship status
     * @param friendshipId - ID of the friendship
     * @param status - New status (pending, accepted, rejected, cancelled)
     * @returns Updated friendship record
     */
    static async updateFriendshipStatus(friendshipId: string, status: string) {
        const query = `
            UPDATE friendships
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;
        
        const result = await DatabaseConnection.query(query, [status, friendshipId]);
        return result.rows[0];
    }

    /**
     * Delete a friendship (unfriend)
     * @param friendshipId - ID of the friendship to delete
     * @returns Boolean indicating success
     */
    static async deleteFriendship(friendshipId: string): Promise<boolean> {
        const query = `
            DELETE FROM friendships
            WHERE id = $1
        `;
        
        const result = await DatabaseConnection.query(query, [friendshipId]);
        return (result.rowCount || 0) > 0;
    }

    /**
     * Get user details by ID
     * @param userId - ID of the user
     * @returns User record or null if not found
     */
    static async getUserById(userId: string) {
        const query = `
            SELECT 
                id, username, first_name, last_name, 
                profile_image_url, email
            FROM users
            WHERE id = $1 AND is_verified = true
        `;
        
        const result = await DatabaseConnection.query(query, [userId]);
        return result.rows[0] || null;
    }
}

