import { FriendsBL } from "../../businessLayer/friends";
import { addNotificationJob, NotificationType } from "../../queues/notificationQueue";
import { logger } from "../../utils";

export class FriendService {
    /**
     * Send a friend request
     * @param requesterId - ID of the user sending the request
     * @param receiverId - ID of the user receiving the request
     * @returns Created friendship record
     */
    static async sendFriendRequest(requesterId: string, receiverId: string) {
        // Create friend request
        const friendship = await FriendsBL.createFriendRequest(requesterId, receiverId);
        
        // Get sender details for notification
        const sender = await FriendsBL.getUserById(requesterId);
        
        // Send notification to receiver
        if (sender) {
            await addNotificationJob({
                userId: receiverId,
                senderId: requesterId,
                type: NotificationType.FRIEND_REQUEST,
                message: `${sender.username} sent you a friend request`,
            });
        }
        
        return friendship;
    }

    /**
     * Accept a friend request
     * @param friendshipId - ID of the friendship
     * @param userId - ID of the user accepting the request
     * @returns Updated friendship record
     */
    static async acceptFriendRequest(friendshipId: string, userId: string) {
        // Get friendship details to verify ownership
        const friendship = await FriendsBL.getFriendshipById(friendshipId);
        
        if (!friendship) {
            throw new Error("Friendship not found");
        }

        // Verify that the user is the receiver of the request
        if (friendship.receiver_id !== userId) {
            throw new Error("Unauthorized: You can only accept requests sent to you");
        }

        // Verify that the friendship status is pending
        if (friendship.status !== 'pending') {
            throw new Error(`Cannot accept friend request. Current status: ${friendship.status}`);
        }

        // Update friendship status
        const updatedFriendship = await FriendsBL.updateFriendshipStatus(
            friendshipId, 
            'accepted'
        );
        
        // Get accepter details for notification
        const accepter = await FriendsBL.getUserById(userId);
        
        // Send notification to requester
        if (accepter) {
            await addNotificationJob({
                userId: friendship.requester_id,
                senderId: userId,
                type: NotificationType.FRIEND_ACCEPTED,
                message: `${accepter.username} accepted your friend request`,
            });
        }
        
        return updatedFriendship;
    }

    /**
     * Reject a friend request
     * @param friendshipId - ID of the friendship
     * @param userId - ID of the user rejecting the request
     * @returns Boolean indicating success
     */
    static async rejectFriendRequest(friendshipId: string, userId: string) {
        // Get friendship details to verify ownership
        const friendship = await FriendsBL.getFriendshipById(friendshipId);
        
        if (!friendship) {
            throw new Error("Friendship not found");
        }

        // Verify that the user is the receiver of the request
        if (friendship.receiver_id !== userId) {
            throw new Error("Unauthorized: You can only reject requests sent to you");
        }

        // Verify that the friendship status is pending
        if (friendship.status !== 'pending') {
            throw new Error(`Cannot reject friend request. Current status: ${friendship.status}`);
        }

        // Store requester ID before deletion for notification
        const requesterId = friendship.requester_id;
        
        // Delete the friendship record
        const deleted = await FriendsBL.deleteFriendship(friendshipId);
        
        if (!deleted) {
            throw new Error("Failed to reject friend request");
        }
        
        // Get rejecter details for notification
        const rejecter = await FriendsBL.getUserById(userId);
        
        // Send notification to requester
        if (rejecter) {
            await addNotificationJob({
                userId: requesterId,
                senderId: userId,
                type: NotificationType.FRIEND_REJECTED,
                message: `${rejecter.username} rejected your friend request`,
            });
        }
        
        return deleted;
    }

    /**
     * Cancel a friend request
     * @param friendshipId - ID of the friendship
     * @param userId - ID of the user cancelling the request
     * @returns Boolean indicating success
     */
    static async cancelFriendRequest(friendshipId: string, userId: string) {
        // Get friendship details to verify ownership
        const friendship = await FriendsBL.getFriendshipById(friendshipId);
        
        if (!friendship) {
            throw new Error("Friendship not found");
        }

        // Verify that the user is the requester
        if (friendship.requester_id !== userId) {
            throw new Error("Unauthorized: You can only cancel requests you sent");
        }

        // Verify that the friendship status is pending
        if (friendship.status !== 'pending') {
            throw new Error(`Cannot cancel friend request. Current status: ${friendship.status}`);
        }

        // Store receiver ID before deletion for notification
        const receiverId = friendship.receiver_id;
        
        // Delete the friendship record
        const deleted = await FriendsBL.deleteFriendship(friendshipId);
        
        if (!deleted) {
            throw new Error("Failed to cancel friend request");
        }
        
        // Get canceller details for notification
        const canceller = await FriendsBL.getUserById(userId);
        
        // Send notification to receiver
        if (canceller) {
            await addNotificationJob({
                userId: receiverId,
                senderId: userId,
                type: NotificationType.FRIEND_CANCELLED,
                message: `${canceller.username} cancelled their friend request`,
            });
        }
        
        return deleted;
    }

    /**
     * Unfriend a user (delete friendship)
     * @param friendshipId - ID of the friendship
     * @param userId - ID of the user unfriending
     * @returns Boolean indicating success
     */
    static async unfriend(friendshipId: string, userId: string) {
        // Get friendship details to verify ownership
        const friendship = await FriendsBL.getFriendshipById(friendshipId);
        
        if (!friendship) {
            throw new Error("Friendship not found");
        }

        // Verify that the user is part of the friendship
        if (friendship.requester_id !== userId && friendship.receiver_id !== userId) {
            throw new Error("Unauthorized: You can only unfriend your own friends");
        }

        // Verify that the friendship status is accepted
        if (friendship.status !== 'accepted') {
            throw new Error(`Cannot unfriend. Current status: ${friendship.status}`);
        }

        // Determine the other user
        const otherUserId = friendship.requester_id === userId 
            ? friendship.receiver_id 
            : friendship.requester_id;

        // Delete the friendship
        const deleted = await FriendsBL.deleteFriendship(friendshipId);
        
        if (!deleted) {
            throw new Error("Failed to delete friendship");
        }
        
        // Get unfriender details for notification
        const unfriender = await FriendsBL.getUserById(userId);
        
        // Send notification to the other user
        if (unfriender) {
            await addNotificationJob({
                userId: otherUserId,
                senderId: userId,
                type: NotificationType.FRIEND_UNFRIENDED,
                message: `${unfriender.username} unfriended you`,
            });
        }
        
        return deleted;
    }

    /**
     * Get all accepted friends for a user
     * @param userId - ID of the user
     * @returns Array of friends
     */
    static async getFriends(userId: string) {
        return await FriendsBL.getAcceptedFriendships(userId);
    }

    /**
     * Get incoming pending friend requests for a user
     * @param userId - ID of the user
     * @returns Array of incoming requests
     */
    static async getIncomingRequests(userId: string) {
        return await FriendsBL.getIncomingPendingRequests(userId);
    }

    /**
     * Get outgoing pending friend requests for a user
     * @param userId - ID of the user
     * @returns Array of outgoing requests
     */
    static async getOutgoingRequests(userId: string) {
        return await FriendsBL.getOutgoingPendingRequests(userId);
    }
}

