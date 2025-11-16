import { DatabaseConnection } from "../../database/DatabaseConnection";
import { Schema } from "express-validator";

export class FriendValidator {
    /**
     * Custom validator to check if user exists and is verified
     */
    public static async userExists(value: string) {
        const query = `
            SELECT id, is_verified 
            FROM users 
            WHERE id = $1
        `;
        const result = await DatabaseConnection.query(query, [value]);
        if (result.rowCount === 0) {
            throw new Error("User not found");
        }
        if (!result.rows[0].is_verified) {
            throw new Error("User is not verified");
        }
        return true;
    }

    /**
     * Combined validator for friend request that checks:
     * 1. User exists
     * 2. Cannot friend self
     * 3. Friendship doesn't already exist
     */
    public static async validateFriendRequest(value: string, { req }: any) {
        const requesterId = req.user?.id;
        const receiverId = value;

        // Check if user exists
        const userCheck = await FriendValidator.userExists(receiverId);
        if (!userCheck) {
            throw new Error("Receiver user not found");
        }

        // Check if trying to friend yourself
        if (requesterId && receiverId && requesterId === receiverId) {
            throw new Error("Cannot send friend request to yourself");
        }

        // Check if an active friendship already exists (pending or accepted)
        // Allow re-requesting if previous request was cancelled or rejected
        if (requesterId && receiverId) {
            const query = `
                SELECT id FROM friendships
                WHERE ((requester_id = $1 AND receiver_id = $2)
                   OR (requester_id = $2 AND receiver_id = $1))
                   AND status IN ('pending', 'accepted')
            `;
            const result = await DatabaseConnection.query(query, [requesterId, receiverId]);
            
            if (result.rowCount > 0) {
                throw new Error("Friendship request already exists");
            }
        }

        return true;
    }

    // ----- Schemas -----
    
    public static requestFriendSchema: Schema = {
        receiverId: {
            in: ["body"],
            notEmpty: {
                errorMessage: "Receiver ID is required",
            },
            isUUID: {
                errorMessage: "Invalid receiver ID format",
            },
            custom: {
                options: FriendValidator.validateFriendRequest,
                errorMessage: "Invalid friend request",
            },
        },
    };

    public static friendRequestIdSchema: Schema = {
        id: {
            in: ["params"],
            notEmpty: {
                errorMessage: "Friendship ID is required",
            },
            isUUID: {
                errorMessage: "Invalid friendship ID format",
            },
        },
    };
}

