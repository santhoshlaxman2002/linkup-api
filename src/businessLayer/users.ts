import { DatabaseConnection } from "../database/DatabaseConnection";
import { v4 as uuidv4 } from "uuid";

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
        `;
        const result = await DatabaseConnection.query(query, [loginName]);
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
}