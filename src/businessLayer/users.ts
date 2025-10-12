import { sendMail, OtpUtils, EmailTemplates } from "../utils";
import { DatabaseConnection } from "../database/DatabaseConnection";
import { v4 as uuidv4 } from "uuid";
import { MailJobPayloadType } from "@/queues/mail.queue";

export class UsersBL {
    /**
     * Utility: Check if a username exists in users table (promise<boolean>)
     */
    static async usernameExists(username: string): Promise<boolean> {
        const result = await DatabaseConnection.query(
            `SELECT username FROM users WHERE username = $1`,
            [username]
        );
        return result.rowCount > 0;
    }

    /**
     * Utility: Find a user by email or username for login
     */
    static async findUserByLoginName(loginName: string) {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginName);
        const userIdentifierField = isEmail ? "email" : "username";
        const query = `
            SELECT id, password_hash, username, first_name, last_name, date_of_birth, email
            FROM users
            WHERE ${userIdentifierField} = $1
                and is_verified = true
        `;
        const result = await DatabaseConnection.query(query, [loginName]);
        if (result.rowCount === 0) return null;
        return result.rows[0];
    }
    /**
     * Utility: Get user by email
     */
    static async getUserByEmail(email: string) {
        const query = `
            SELECT id, username, first_name, last_name, email, date_of_birth, is_verified, created_at, updated_at, bio, profile_image_url
            FROM users
            WHERE email = $1
        `;
        const result = await DatabaseConnection.query(query, [email]);
        if (result.rowCount === 0) return null;
        return result.rows[0];
    }

    /**
     * Utility: Generate candidate usernames by pattern
     */
    static generateUsernameCandidates(base: string, firstName = "", attempt = 1) {
        const randomSuffix = Math.random().toString(36).substring(2, 5);
        const shortUUID = uuidv4().split("-")[0].substring(0, 3);
        const year = new Date().getFullYear().toString();

        const patterns = [
            `${base}_${year}${randomSuffix}`,
            firstName ? `${firstName.toLowerCase()}_${shortUUID}` : undefined,
            `${base}${attempt}`,
            `${base}_${randomSuffix}`,
        ].filter(Boolean) as string[];

        return patterns;
    }

    /**
     * Utility: Generate a new unique username given a base and name parts
     */
    static async generateUniqueUsername(baseUsername: string, firstName?: string, maxAttempts = 50): Promise<string | null> {
        // Try pure base first
        if (!(await this.usernameExists(baseUsername))) return baseUsername;
        let attempt = 1;
        while (attempt <= maxAttempts) {
            const candidates = this.generateUsernameCandidates(baseUsername, firstName, attempt);
            for (const candidate of candidates) {
                if (!(await this.usernameExists(candidate))) {
                    return candidate;
                }
            }
            attempt++;
        }
        return null;
    }

    /**
     * Utility: Suggest available usernames (for validation endpoint)
     */
    static async generateUsernameSuggestions(base: string, maxSuggestions = 5): Promise<string[]> {
        let suggestions: string[] = [];
        let attempt = 1;
        while (suggestions.length < maxSuggestions && attempt <= 30) {
            const randomSuffix = Math.random().toString(36).substring(2, 5);
            const year = new Date().getFullYear().toString();
            const candidateList = [
                `${base}_${randomSuffix}`,
                `${base}${attempt}`,
                `${base}_${year.substring(2)}${attempt}`,
                `${base}_${attempt}${randomSuffix}`,
                `${base}_${Math.floor(Math.random() * 1000)}`
            ];
            for (const candidate of candidateList) {
                if (suggestions.length >= maxSuggestions) break;
                if (!(await this.usernameExists(candidate)) && !suggestions.includes(candidate)) {
                    suggestions.push(candidate);
                }
            }
            attempt++;
        }
        return suggestions;
    }
    /**
     * Generates a 6-digit OTP, stores it in the otp_verification table with user_id, and sends it to the user's email.
     * @param userId - ID of the user requesting OTP
     * @param email - Email address to send the OTP to
     * @returns Promise<void>
     */
    static async generateAndSendOtp(userId: string, email: string, type: MailJobPayloadType): Promise<void> {
        // Generate and store OTP using utility
        const otp = await OtpUtils.generateAndStoreOtp(userId);

        // Send the OTP to user's email
        await this.sendOtpEmail(email, otp, type);
    }

    /**
     * Sends an OTP code to the specified user's email using a styled HTML template.
     * @param to - The recipient's email address.
     * @param otp - The one-time password to send.
     * @returns Promise<void>
     */
    static async sendOtpEmail(to: string, otp: string, type: MailJobPayloadType): Promise<void> {
        const emailData = EmailTemplates.generateOtpEmailData(to, otp, type);
        await sendMail(emailData);
    }
}