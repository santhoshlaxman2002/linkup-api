import { DatabaseConnection } from "../../database/DatabaseConnection";
import { JwtUtils, PasswordUtils, StandardResponse, logger, OtpUtils } from "../../utils";
import { UsersBL } from '../../businessLayer'
import { Request, Response } from "express";
import { Mailjob } from "../../queues";

class AuthController {
    public static async register(req: Request, res: Response) {
        logger.info("Register endpoint called", { body: { ...req.body, password: undefined } });
        try {
            const { firstName, lastName, dateOfBirth, username, email, password } = req.body;
            logger.debug("Start hashing password for registration", { username, email });
            const passwordHash = await PasswordUtils.hashPassword(password);

            const query = `
                INSERT INTO users (first_name, last_name, date_of_birth, username, email, password_hash) 
                VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email
            `;

            logger.debug("Attempting to insert user into DB", { username, email });
            const result = await DatabaseConnection.query(query, [firstName, lastName, dateOfBirth, username, email, passwordHash]);

            if (result.rowCount === 0) {
                logger.warn("Registration failed: No row inserted to DB", { username, email });
                return StandardResponse.badRequest(res, "Failed to register");
            }

            const { id: userId } = result.rows[0];
            logger.info("User created successfully", { userId, email });

            await Mailjob.addMailJob({
                userId,
                email,
                type: 'verify'
            });
            logger.debug("Registration mail job dispatched", { userId, email });

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
            logger.debug("Finding user for loginName", { loginName });
            const user = await UsersBL.findUserByLoginName(loginName);

            if (!user) {
                logger.warn("Login failed: User not found", { loginName });
                return StandardResponse.unauthorized(res, "Invalid email or password");
            }
            logger.debug("Verifying password for user", { userId: user.id });

            const isMatch = await PasswordUtils.comparePassword(password, user.password_hash);

            if (!isMatch) {
                logger.warn("Login failed: Incorrect password", { loginName, userId: user.id });
                return StandardResponse.unauthorized(res, "Invalid email or password");
            }
            const token = JwtUtils.sign({ userId: user.id });

            logger.info("User login successful", { userId: user.id, email: user.email });

            return StandardResponse.success(res, { token }, "Login successful");
        } catch (error) {
            logger.error("Error during user login", { error, body: { ...req.body, password: undefined } });
            return StandardResponse.internalServerError(res, "An error occurred during login", error);
        }
    }

    public static async confirm(req: Request, res: Response) {
        logger.info("Confirm endpoint invoked", { body: req.body });
        try {
            const { otp, email } = req.body;
            logger.debug("Fetching user by email for confirmation", { email });
            const user = await UsersBL.getUserByEmail(email);

            if (!user) {
                logger.warn("User not found for confirmation", { email });
                return StandardResponse.unauthorized(res, "User not found");
            }

            logger.debug("Validating OTP using utility", { otp, userId: user.id });
            const otpValidation = await OtpUtils.validateOtp(otp, user.id);

            if (!otpValidation.isValid) {
                logger.warn("OTP validation failed", { otp, email, userId: user.id });
                return StandardResponse.unauthorized(res, "OTP is not valid");
            }

            logger.debug("Marking OTP as verified", { otpId: otpValidation.otpId });
            await OtpUtils.markOtpAsVerified(otpValidation.otpId!);

            const userUpdateQuery = `
                UPDATE users SET is_verified = true
                WHERE id = $1
            `;

            logger.debug("Updating user as verified in users table", { userId: user.id });
            await DatabaseConnection.query(userUpdateQuery, [user.id]);

            const token = JwtUtils.sign({ userId: user.id });
            logger.info("User successfully verified and confirmed", { userId: user.id });

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
            logger.debug("Building base username from first/last name", { firstName, lastName });

            // Generate base username
            const baseUsername = `${firstName}${lastName || ""}`
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "")
                .slice(0, 20); // Limit to avoid super long names

            if (!baseUsername) {
                logger.warn("Base username invalid after formatting", { firstName, lastName, baseUsername });
                return StandardResponse.badRequest(res, "Invalid name for username generation");
            }

            logger.debug("Attempting to generate unique username", { baseUsername, firstName });
            const uniqueUsername = await UsersBL.generateUniqueUsername(baseUsername, firstName);

            if (uniqueUsername) {
                logger.info(
                    uniqueUsername === baseUsername ? "Username available" : "Unique username generated",
                    { username: uniqueUsername }
                );
                return StandardResponse.success(res, { username: uniqueUsername });
            }

            logger.error("Could not generate unique username after retries", { firstName, lastName });
            return StandardResponse.internalServerError(res, "Unable to generate unique username");
        } catch (error) {
            logger.error("Error during username generation", { error, body: req.body });
            return StandardResponse.internalServerError(res, "Error generating username", error);
        }
    }

    public static async validateUsername(req: Request, res: Response) {
        const { username } = req.body;
        logger.info("Validate username endpoint called", { username });
        try {
            logger.debug("Checking if username exists", { username });
            if (!(await UsersBL.usernameExists(username))) {
                logger.info("Username is unique", { username });
                return StandardResponse.success(res, {
                    unique: true,
                    username,
                    suggestions: []
                });
            }
            logger.debug("Username taken, generating suggestions", { username });
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

    public static async initiateForgotPassword(req: Request, res: Response) {
        logger.info("Initiate forgot password endpoint called", {
            body: { ...req.body, loginName: req.body?.loginName }
        });
        try {
            const loginName = req.body.loginName;
            logger.debug("Finding user by loginName for forgot password", { loginName });
            const userData = await UsersBL.findUserByLoginName(loginName);

            if (!userData) {
                logger.warn("Forgot password: user not found", { loginName });
                return StandardResponse.notFound(res, "User not found");
            }

            logger.info("Adding forgot password mail job", { userId: userData.id, email: userData.email });
            await Mailjob.addMailJob({
                email: userData.email,
                userId: userData.id,
                type: 'forgotpassword'
            });

            logger.info("Forgot password initiated successfully", { userId: userData.id });
            return StandardResponse.success(res, undefined, "Forgot Passward Initiated");
        } catch (err) {
            logger.error("Error initiating forgot password", {
                error: err,
                body: { ...req.body, loginName: req.body?.loginName }
            });
            return StandardResponse.internalServerError(res, "Something went wrong");
        }
    }

    public static async changePassword(req: Request, res: Response) {
        logger.info("Change password endpoint called", {
            body: { ...req.body, loginName: req.body?.loginName, otp: req.body?.otp ? "[REDACTED]" : undefined, newPassword: "[REDACTED]" }
        });
        try {
            const { loginName, otp, newPassword } = req.body;

            logger.debug("Finding user by loginName for password change", { loginName });
            const userData = await UsersBL.findUserByLoginName(loginName);

            if (!userData) {
                logger.warn("Change password: user not found", { loginName });
                return StandardResponse.notFound(res, "User not found");
            }

            logger.debug("Validating OTP for password change", { userId: userData.id });
            const otpValidation = await OtpUtils.validateOtp(otp, userData.id);

            if (!otpValidation.isValid) {
                logger.warn("Invalid OTP for password change", { userId: userData.id });
                return StandardResponse.badRequest(res, "Invalid or expired OTP");
            }
            // Check if new password is the same as the old password
            const currentPasswordHash = userData.password_hash;
            const isSamePassword = await PasswordUtils.comparePassword(newPassword, currentPasswordHash);

            if (isSamePassword) {
                logger.warn("New password matches old password", { userId: userData.id });
                return StandardResponse.badRequest(res, "New password must be different from the old password");
            }

            logger.debug("Hashing new password", { userId: userData.id });
            const newPasswordHash = await PasswordUtils.hashPassword(newPassword);

            logger.debug("Updating user password in database", { userId: userData.id });
            const updateQuery = `
                UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `;
            await DatabaseConnection.query(updateQuery, [newPasswordHash, userData.id]);

            logger.debug("Marking OTP as verified", { otpId: otpValidation.otpId });
            await OtpUtils.markOtpAsVerified(otpValidation.otpId);

            logger.info("Password changed successfully", { userId: userData.id });
            return StandardResponse.success(res, undefined, "Password changed successfully");
        } catch (err) {
            logger.error("Error changing password", {
                error: err,
                body: { ...req.body, loginName: req.body?.loginName, newPassword: "[REDACTED]" }
            });
            return StandardResponse.internalServerError(res, "Something went wrong");
        }
    }
}

export default AuthController;