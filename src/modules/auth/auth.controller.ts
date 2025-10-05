import { DatabaseConnection } from "../../database/DatabaseConnection";
import { JwtUtils, PasswordUtils, StandardResponse, logger } from "../../utils";
import { Request, Response } from "express";

class AuthController {
    public static async register(req: Request, res: Response) {
        logger.info("Register endpoint called", { body: { ...req.body, password: undefined } });
        try {
            const { firstName, lastName, dateOfBirth, username, email, password } = req.body;
            logger.debug("Hashing password for new user", { username, email });
            const passwordHash = await PasswordUtils.hashPassword(password);
            const query = `
                INSERT INTO users (first_name, last_name, date_of_birth, username, email, password_hash) 
                    VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
            `;
            logger.debug("Inserting new user into database", { username, email });
            const result = await DatabaseConnection.query(query, [firstName, lastName, dateOfBirth, username, email, passwordHash]);
            if (result.rowCount === 0) {
                logger.warn("User registration failed: No rows inserted", { username, email });
                return StandardResponse.badRequest(res, "Failed to register");
            }
            const userId = result.rows[0].id;
            const token = JwtUtils.sign({ userId });
            logger.info("User registered successfully", { userId, username, email });
            return StandardResponse.success(res, { userId, token }, "Registered");
        } catch (error) {
            logger.error("Error during user registration", { error, body: { ...req.body, password: undefined } });
            return StandardResponse.internalServerError(res, "An error occurred during registration", error);
        }
    }

    public static async login(req: Request, res: Response) {
        logger.info("Login endpoint called", { body: { ...req.body, password: undefined } });
        try {
            const { loginName, password } = req.body;
            // Determine if loginName is an email or username
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginName);
            const userIdentifierField = isEmail ? "email" : "username";
            const userIdentifierValue = loginName;
            const query = `
                SELECT id, password_hash, username, first_name, last_name, date_of_birth
                FROM users
                WHERE ${userIdentifierField} = $1
            `;
            logger.debug("Fetching user for login", { [userIdentifierField]: userIdentifierValue });
            const result = await DatabaseConnection.query(query, [userIdentifierValue]);
            if (result.rowCount === 0) {
                logger.warn("Login failed: User not found", { [userIdentifierField]: userIdentifierValue });
                return StandardResponse.unauthorized(res, "Invalid email or password");
            }
            const user = result.rows[0];
            // Compare password
            const isMatch = await PasswordUtils.comparePassword(password, user.password_hash);
            if (!isMatch) {
                logger.warn("Login failed: Incorrect password", { loginName });
                return StandardResponse.unauthorized(res, "Invalid email or password");
            }
            // Generate JWT token
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
}

export default AuthController;