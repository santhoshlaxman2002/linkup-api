import { Request, Response, NextFunction } from "express";
import { JwtUtils, logger, StandardResponse } from "../utils";
import { UsersBL } from "../businessLayer";

// Extend Express Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email: string;
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        isVerified: boolean;
        bio?: string;
        profileImageUrl?: string;
        createdAt: string;
        updatedAt: string;
      };
    }
  }
}

export class AuthMiddleware {
  /**
   * Middleware to authenticate JWT token and attach user data to request
   * @returns Express middleware function
   */
  public static authenticate() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
          logger.warn("Authentication failed: No authorization header", { 
            path: req.path, 
            method: req.method 
          });
          return StandardResponse.unauthorized(res, "Access token is required");
        }

        // Check if header starts with 'Bearer '
        if (!authHeader.startsWith('Bearer ')) {
          logger.warn("Authentication failed: Invalid authorization header format", { 
            path: req.path, 
            method: req.method,
            authHeader: authHeader.substring(0, 20) + "..." // Log partial header for debugging
          });
          return StandardResponse.unauthorized(res, "Invalid token format. Use 'Bearer <token>'");
        }

        // Extract token from header
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        if (!token) {
          logger.warn("Authentication failed: Empty token", { 
            path: req.path, 
            method: req.method 
          });
          return StandardResponse.unauthorized(res, "Access token is required");
        }

        // Verify JWT token
        logger.debug("Verifying JWT token", { path: req.path });
        const decoded = JwtUtils.verify<{ userId: string }>(token);

        if (!decoded.userId) {
          logger.warn("Authentication failed: Invalid token payload", { 
            path: req.path, 
            method: req.method 
          });
          return StandardResponse.unauthorized(res, "Invalid token");
        }

        // Fetch user data from database
        logger.debug("Fetching user data for authenticated user", { 
          userId: decoded.userId, 
          path: req.path 
        });
        
        const user = await UsersBL.getUserById(decoded.userId);

        if (!user) {
          logger.warn("Authentication failed: User not found", { 
            userId: decoded.userId, 
            path: req.path 
          });
          return StandardResponse.unauthorized(res, "User not found");
        }

        // Check if user is verified
        if (!user.is_verified) {
          logger.warn("Authentication failed: User not verified", { 
            userId: decoded.userId, 
            email: user.email,
            path: req.path 
          });
          return StandardResponse.forbidden(res, "Account not verified");
        }

        // Attach user data to request object
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          dateOfBirth: user.date_of_birth,
          isVerified: user.is_verified,
          bio: user.bio,
          profileImageUrl: user.profile_image_url,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        };

        logger.debug("User authenticated successfully", { 
          userId: user.id, 
          username: user.username,
          path: req.path 
        });

        return next();
      } catch (error) {
        logger.error("Authentication error", { 
          error, 
          path: req.path, 
          method: req.method 
        });

        // Handle JWT specific errors
        if (error instanceof Error) {
          if (error.name === 'TokenExpiredError') {
            return StandardResponse.unauthorized(res, "Token has expired");
          }
          if (error.name === 'JsonWebTokenError') {
            return StandardResponse.unauthorized(res, "Invalid token");
          }
          if (error.name === 'NotBeforeError') {
            return StandardResponse.unauthorized(res, "Token not active");
          }
        }

        return StandardResponse.internalServerError(res, "Authentication failed", error);
      }
    };
  }

  /**
   * Optional middleware to authenticate JWT token without failing if token is missing
   * Useful for endpoints that work with or without authentication
   * @returns Express middleware function
   */
  public static optionalAuth() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          // No token provided, continue without authentication
          logger.debug("Optional auth: No token provided", { path: req.path });
          return next();
        }

        const token = authHeader.substring(7);
        
        if (!token) {
          logger.debug("Optional auth: Empty token", { path: req.path });
          return next();
        }

        // Try to verify token and attach user if valid
        const decoded = JwtUtils.verify<{ userId: string }>(token);
        
        if (decoded.userId) {
          const user = await UsersBL.getUserById(decoded.userId);
          
          if (user && user.is_verified) {
            req.user = {
              id: user.id,
              username: user.username,
              email: user.email,
              firstName: user.first_name,
              lastName: user.last_name,
              dateOfBirth: user.date_of_birth,
              isVerified: user.is_verified,
              bio: user.bio,
              profileImageUrl: user.profile_image_url,
              createdAt: user.created_at,
              updatedAt: user.updated_at
            };
            
            logger.debug("Optional auth: User authenticated", { 
              userId: user.id, 
              path: req.path 
            });
          }
        }
        
        next();
      } catch (error) {
        // For optional auth, we don't fail on token errors
        logger.debug("Optional auth: Token verification failed, continuing without auth", { 
          error: error instanceof Error ? error.message : error,
          path: req.path 
        });
        next();
      }
    };
  }
}
