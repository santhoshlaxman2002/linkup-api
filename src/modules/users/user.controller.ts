import { Request, Response } from "express";
import { UsersBL } from "../../businessLayer/users";
import { StandardResponse, logger } from "../../utils";

class UserController {
    /**
     * Search users by name or username, ordered by mutual friends
     * GET /api/users/search
     */
    public static async searchUsers(req: Request, res: Response) {
        try {
            const currentUserId = req.user!.id;
            const { q: searchTerm, limit = 20, offset = 0 } = req.query;

            logger.info("Search users endpoint called", {
                currentUserId,
                searchTerm,
                limit,
                offset
            });

            // Validate search term
            if (!searchTerm || typeof searchTerm !== 'string') {
                return StandardResponse.badRequest(res, "Search term 'q' is required");
            }

            if (searchTerm.trim().length === 0) {
                return StandardResponse.badRequest(res, "Search term cannot be empty");
            }

            const results = await UsersBL.searchUsers(
                searchTerm.trim(),
                currentUserId,
                parseInt(limit as string),
                parseInt(offset as string)
            );

            logger.info("User search completed successfully", {
                resultCount: results.length
            });

            return StandardResponse.success(
                res,
                results,
                "Users retrieved successfully"
            );
        } catch (error: any) {
            logger.error("Error searching users", { error });
            return StandardResponse.internalServerError(
                res,
                "Failed to search users",
                error
            );
        }
    }

    /**
     * Get recent user searches for a user
     * GET /api/users/recent-searches
     */
    public static async getRecentUserSearches(req: Request, res: Response) {
        try {
            const currentUserId = req.user!.id;
            const { limit = 10, offset = 0 } = req.query;
            const results = await UsersBL.getRecentUserSearches(currentUserId, parseInt(offset as string), parseInt(limit as string));
            return StandardResponse.success(
                res,
                results,
                "Recent user searches retrieved successfully"
            );
        }
        catch (error: any) {
            logger.error("Error getting recent user searches", { error });
            return StandardResponse.internalServerError(
                res,
                "Failed to get recent user searches",
                error
            );
        }
    }
}

export default UserController;

