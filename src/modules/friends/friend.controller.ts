import { Request, Response } from "express";
import { FriendService } from "./friend.service";
import { StandardResponse, logger } from "../../utils";

class FriendController {
    /**
     * Send a friend request
     * POST /api/friends/request
     */
    public static async sendRequest(req: Request, res: Response) {
        try {
            const requesterId = req.user!.id;
            const { receiverId } = req.body;

            logger.info("Send friend request endpoint called", {
                requesterId,
                receiverId
            });

            const friendship = await FriendService.sendFriendRequest(
                requesterId, 
                receiverId
            );

            logger.info("Friend request sent successfully", {
                friendshipId: friendship.id
            });

            return StandardResponse.success(
                res,
                friendship,
                "Friend request sent successfully"
            );
        } catch (error: any) {
            logger.error("Error sending friend request", { error });
            return StandardResponse.internalServerError(
                res,
                error.message || "Failed to send friend request",
                error
            );
        }
    }

    /**
     * Accept a friend request
     * POST /api/friends/accept/:id
     */
    public static async acceptRequest(req: Request, res: Response) {
        try {
            const userId = req.user!.id;
            const { id: friendshipId } = req.params;

            logger.info("Accept friend request endpoint called", {
                userId,
                friendshipId
            });

            const friendship = await FriendService.acceptFriendRequest(
                friendshipId,
                userId
            );

            logger.info("Friend request accepted successfully", {
                friendshipId: friendship.id
            });

            return StandardResponse.success(
                res,
                friendship,
                "Friend request accepted successfully"
            );
        } catch (error: any) {
            logger.error("Error accepting friend request", { error });
            
            if (error.message === "Friendship not found") {
                return StandardResponse.notFound(res, error.message);
            }
            if (error.message.includes("Unauthorized")) {
                return StandardResponse.forbidden(res, error.message);
            }
            
            return StandardResponse.internalServerError(
                res,
                error.message || "Failed to accept friend request",
                error
            );
        }
    }

    /**
     * Reject a friend request
     * POST /api/friends/reject/:id
     */
    public static async rejectRequest(req: Request, res: Response) {
        try {
            const userId = req.user!.id;
            const { id: friendshipId } = req.params;

            logger.info("Reject friend request endpoint called", {
                userId,
                friendshipId
            });

            await FriendService.rejectFriendRequest(
                friendshipId,
                userId
            );

            logger.info("Friend request rejected successfully", {
                friendshipId
            });

            return StandardResponse.success(
                res,
                null,
                "Friend request rejected successfully"
            );
        } catch (error: any) {
            logger.error("Error rejecting friend request", { error });
            
            if (error.message === "Friendship not found") {
                return StandardResponse.notFound(res, error.message);
            }
            if (error.message.includes("Unauthorized")) {
                return StandardResponse.forbidden(res, error.message);
            }
            
            return StandardResponse.internalServerError(
                res,
                error.message || "Failed to reject friend request",
                error
            );
        }
    }

    /**
     * Cancel a friend request
     * POST /api/friends/cancel/:id
     */
    public static async cancelRequest(req: Request, res: Response) {
        try {
            const userId = req.user!.id;
            const { id: friendshipId } = req.params;

            logger.info("Cancel friend request endpoint called", {
                userId,
                friendshipId
            });

            await FriendService.cancelFriendRequest(
                friendshipId,
                userId
            );

            logger.info("Friend request cancelled successfully", {
                friendshipId
            });

            return StandardResponse.success(
                res,
                null,
                "Friend request cancelled successfully"
            );
        } catch (error: any) {
            logger.error("Error cancelling friend request", { error });
            
            if (error.message === "Friendship not found") {
                return StandardResponse.notFound(res, error.message);
            }
            if (error.message.includes("Unauthorized")) {
                return StandardResponse.forbidden(res, error.message);
            }
            
            return StandardResponse.internalServerError(
                res,
                error.message || "Failed to cancel friend request",
                error
            );
        }
    }

    /**
     * Unfriend a user
     * DELETE /api/friends/:id
     */
    public static async unfriend(req: Request, res: Response) {
        try {
            const userId = req.user!.id;
            const { id: friendshipId } = req.params;

            logger.info("Unfriend endpoint called", {
                userId,
                friendshipId
            });

            await FriendService.unfriend(friendshipId, userId);

            logger.info("Unfriended successfully", {
                friendshipId
            });

            return StandardResponse.success(
                res,
                null,
                "Unfriended successfully"
            );
        } catch (error: any) {
            logger.error("Error unfriending", { error });
            
            if (error.message === "Friendship not found") {
                return StandardResponse.notFound(res, error.message);
            }
            if (error.message.includes("Unauthorized")) {
                return StandardResponse.forbidden(res, error.message);
            }
            
            return StandardResponse.internalServerError(
                res,
                error.message || "Failed to unfriend",
                error
            );
        }
    }

    /**
     * Get all friends
     * GET /api/friends
     */
    public static async getFriends(req: Request, res: Response) {
        try {
            const userId = req.user!.id;

            logger.info("Get friends endpoint called", { userId });

            const friends = await FriendService.getFriends(userId);

            logger.info("Friends retrieved successfully", {
                count: friends.length
            });

            return StandardResponse.success(
                res,
                friends,
                "Friends retrieved successfully"
            );
        } catch (error: any) {
            logger.error("Error retrieving friends", { error });
            return StandardResponse.internalServerError(
                res,
                "Failed to retrieve friends",
                error
            );
        }
    }

    /**
     * Get incoming friend requests
     * GET /api/friends/requests
     */
    public static async getIncomingRequests(req: Request, res: Response) {
        try {
            const userId = req.user!.id;

            logger.info("Get incoming requests endpoint called", { userId });

            const requests = await FriendService.getIncomingRequests(userId);

            logger.info("Incoming requests retrieved successfully", {
                count: requests.length
            });

            return StandardResponse.success(
                res,
                requests,
                "Incoming requests retrieved successfully"
            );
        } catch (error: any) {
            logger.error("Error retrieving incoming requests", { error });
            return StandardResponse.internalServerError(
                res,
                "Failed to retrieve incoming requests",
                error
            );
        }
    }

    /**
     * Get outgoing friend requests
     * GET /api/friends/sent
     */
    public static async getOutgoingRequests(req: Request, res: Response) {
        try {
            const userId = req.user!.id;

            logger.info("Get outgoing requests endpoint called", { userId });

            const requests = await FriendService.getOutgoingRequests(userId);

            logger.info("Outgoing requests retrieved successfully", {
                count: requests.length
            });

            return StandardResponse.success(
                res,
                requests,
                "Outgoing requests retrieved successfully"
            );
        } catch (error: any) {
            logger.error("Error retrieving outgoing requests", { error });
            return StandardResponse.internalServerError(
                res,
                "Failed to retrieve outgoing requests",
                error
            );
        }
    }
}

export default FriendController;

