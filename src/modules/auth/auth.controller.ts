import { DatabaseConnection } from "../../database/DatabaseConnection";
import { JwtUtils, PasswordUtils, StandardResponse, logger } from "../../utils";
import { UsersBL } from '../../businessLayer'
import { Request, Response } from "express";
import { Mailjob } from "../../queues";



class AuthController {
    public static async register(req: Request, res: Response) {
        logger.info("Register endpoint called", { body: { ...req.body, password: undefined } });
        try {
            const { firstName, lastName, dateOfBirth, username, email, password } = req.body;
            logger.debug("Hashing password for new user", { username, email });
            const passwordHash = await PasswordUtils.hashPassword(password);
            const query = `
                INSERT INTO users (first_name, last_name, date_of_birth, username, email, password_hash) 
                    VALUES ($1, $2, $3, $4, $5, $6) RETURNING id,email
            `;
            logger.debug("Inserting new user into database", { username, email });
            const result = await DatabaseConnection.query(query, [firstName, lastName, dateOfBirth, username, email, passwordHash]);
            if (result.rowCount === 0) {
                logger.warn("User registration failed: No rows inserted", { username, email });
                return StandardResponse.badRequest(res, "Failed to register");
            }
            const { id: userId } = result.rows[0];
            await Mailjob.addMailJob({ userId, email })
            return StandardResponse.success(res, { userId, email }, "Registered");
        } catch (error) {
            logger.error("Error during user registration", { error, body: { ...req.body, password: undefined } });
            return StandardResponse.internalServerError(res, "An error occurred during registration", error);
        }
    }

    public static async login(req: Request, res: Response) {
        logger.info("Login endpoint called", { body: { ...req.body, password: undefined } });
        try {
            const { loginName, password } = req.body;
            const user = await UsersBL.findUserByLoginName(loginName);
            if (!user) {
                logger.warn("Login failed: User not found", { loginName });
                return StandardResponse.unauthorized(res, "Invalid email or password");
            }
            const isMatch = await PasswordUtils.comparePassword(password, user.password_hash);
            if (!isMatch) {
                logger.warn("Login failed: Incorrect password", { loginName });
                return StandardResponse.unauthorized(res, "Invalid email or password");
            }
            const token = JwtUtils.sign({ userId: user.id });
            logger.info("User logged in successfully", { userId: user.id, email: user.email });
            return StandardResponse.success(
                res,
                { token },
                "Login successful"
            );
        } catch (error) {
            logger.error("Error during user login", { error, body: { ...req.body, password: undefined } });
            return StandardResponse.internalServerError(res, "An error occurred during login", error);
        }
    }

    public static async confirm(req: Request, res: Response) {
        logger.info("Confirm User endpoint called", { body: req.body });
        try {
            const { otp, email } = req.body;
            logger.debug("Fetching user by email for confirmation", { email });
            const user = await UsersBL.getUserByEmail(email);

            if (!user) {
                logger.warn("User for confirmation not found", { email });
                return StandardResponse.unauthorized(res, "User not found");
            }

            const otpVerificationQuery = `
                SELECT 
                    true as "isValid"
                FROM otp_verifications ov
                WHERE ov.otp = $1
                  AND ov.user_id = $2
                  AND ov.expires_at > (current_timestamp at time zone 'utc')
            `;
            logger.debug("Checking OTP verification", { otp, userId: user.id });
            const result = await DatabaseConnection.query(otpVerificationQuery, [otp, user.id]);
            logger.debug("OTP verification result", { rowCount: result.rowCount, rows: result.rows });

            if (result.rowCount === 0 || !result.rows[0].isValid) {
                logger.warn("OTP is not valid", { otp, email, userId: user.id });
                return StandardResponse.unauthorized(res, "OTP is not valid");
            }

            const userUpdateQuery = `
                UPDATE users SET is_verified = true
                WHERE id = $1
            `;
            logger.debug("Updating user as verified", { userId: user.id });
            await DatabaseConnection.query(userUpdateQuery, [user.id ]);
            const token = JwtUtils.sign({ userId: user.id });
            logger.info("User verified and confirmed successfully", { userId: user.id });

            return StandardResponse.success(res, { token }, "Account verified successfully");
        } catch (error) {
            logger.error("Error during user confirmation", { error, body: req.body });
            return StandardResponse.internalServerError(
                res,
                "An error occurred during confirmation",
                error
            );
        }
    }

    public static async generateUsername(req: Request, res: Response) {
        logger.info("Generate username endpoint called", { body: req.body });

        try {
            const { firstName, lastName } = req.body;

            // Generate base username
            const baseUsername = `${firstName}${lastName || ""}`
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "")
                .slice(0, 20); // Limit to avoid super long names

            if (!baseUsername) {
                return StandardResponse.badRequest(res, "Invalid name for username generation");
            }

            const uniqueUsername = await UsersBL.generateUniqueUsername(baseUsername, firstName);
            if (uniqueUsername) {
                logger.info(
                    uniqueUsername === baseUsername ? "Username available" : "Unique username generated",
                    { username: uniqueUsername }
                );
                return StandardResponse.success(res, { username: uniqueUsername });
            }

            logger.error("Unable to generate unique username after retries", { firstName, lastName });
            return StandardResponse.internalServerError(res, "Unable to generate unique username");
        } catch (error) {
            logger.error("Error during username generation", { error, body: req.body });
            return StandardResponse.internalServerError(res, "Error generating username", error);
        }
    }

    public static async validateUsername(req: Request, res: Response) {
        const { username } = req.body;
        try {
            // 1️⃣ Check if username already exists
            if (!(await UsersBL.usernameExists(username))) {
                logger.info("Username is unique", { username });
                return StandardResponse.success(res, {
                    unique: true,
                    username,
                    suggestions: []
                });
            }

            // 2️⃣ Username taken. Generate suggestions
            const base = username.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
            const suggestions = await UsersBL.generateUsernameSuggestions(base);
            logger.info("Username not unique, suggestions generated", { username, suggestions });
            return StandardResponse.success(res, {
                unique: false,
                username,
                suggestions
            });
        } catch (error) {
            logger.error("Error during username validation", { error, body: req.body });
            return StandardResponse.internalServerError(res, "Error validating username", error);
        }
    }
}

export default AuthController;