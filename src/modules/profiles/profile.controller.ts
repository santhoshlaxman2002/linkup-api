import { Request, Response } from "express";
import { ProfileBL } from "../../businessLayer";
import { logger, StandardResponse } from "../../utils";
import { ProfileUpdateRequest } from "./types";

class ProfileController {
    /**
     * Get current user's profile
     */
    public static async getProfile(req: Request, res: Response) {
        logger.info("Get profile endpoint called", {
            userId: req.user?.id
        });

        try {
            // Ensure user is authenticated (this should be handled by middleware, but extra safety)
            if (!req.user) {
                logger.warn("Get profile attempted without authentication");
                return StandardResponse.unauthorized(res, "Authentication required");
            }

            logger.debug("Fetching user profile", {
                userId: req.user.id
            });

            const profile = await ProfileBL.getProfileById(req.user.id);

            if (!profile) {
                logger.warn("Profile not found", {
                    userId: req.user.id
                });
                return StandardResponse.notFound(res, "Profile not found");
            }

            logger.info("Profile retrieved successfully", {
                userId: req.user.id
            });
            return StandardResponse.success(res, profile, "Profile retrieved successfully");
        } catch (error) {
            logger.error("Get profile failed", {
                error,
                userId: req.user?.id
            });
            return StandardResponse.internalServerError(res, "Failed to retrieve profile", error);
        }
    }

    /**
     * Update current user's profile
     */
    public static async updateProfile(req: Request, res: Response) {
        logger.info("Update profile endpoint called", {
            userId: req.user?.id,
            updateData: req.body
        });

        try {
            // Ensure user is authenticated (this should be handled by middleware, but extra safety)
            if (!req.user) {
                logger.warn("Update profile attempted without authentication");
                return StandardResponse.unauthorized(res, "Authentication required");
            }

            const updateData: ProfileUpdateRequest = req.body;

            // Check if any data is provided for update
            const hasUpdateData = Object.keys(updateData).some(key =>
                updateData[key as keyof ProfileUpdateRequest] !== undefined
            );

            if (!hasUpdateData) {
                logger.warn("No profile data provided for update", {
                    userId: req.user.id
                });
                return StandardResponse.badRequest(res, "No profile data provided for update");
            }

            logger.debug("Updating user profile", {
                userId: req.user.id,
                updateFields: Object.keys(updateData).filter(key =>
                    updateData[key as keyof ProfileUpdateRequest] !== undefined
                )
            });

            const updatedProfile = await ProfileBL.updateProfile(req.user.id, updateData);

            if (!updatedProfile) {
                logger.warn("Profile update failed - user not found", {
                    userId: req.user.id
                });
                return StandardResponse.notFound(res, "Profile not found");
            }

            logger.info("Profile updated successfully", {
                userId: req.user.id
            });
            return StandardResponse.success(res, updatedProfile, "Profile updated successfully");
        } catch (error) {
            logger.error("Update profile failed", {
                error,
                userId: req.user?.id
            });
            return StandardResponse.internalServerError(res, "Failed to update profile", error);
        }
    }
}

export default ProfileController;
