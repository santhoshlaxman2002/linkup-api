import { sendMail, OtpUtils, EmailTemplates, logger } from "../utils";
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
   * Utility: Get user by ID
   */
  static async getUserById(userId: string) {
    const query = `
            SELECT id, username, first_name, last_name, email, date_of_birth, is_verified, created_at, updated_at, bio, profile_image_url
            FROM users
            WHERE id = $1
        `;
    const result = await DatabaseConnection.query(query, [userId]);
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

  /**
   * Search users by name or username, ordered by mutual friends count
   * @param searchTerm - Search term to match against name or username
   * @param currentUserId - ID of the current user performing the search
   * @param limit - Maximum number of results to return
   * @param offset - Number of results to skip
   * @returns Array of users with mutual friends count
   */
  static async searchUsers(
    searchTerm: string,
    currentUserId: string,
    limit: number = 20,
    offset: number = 0
  ) {
    logger.debug("Searching users", { searchTerm, currentUserId, limit, offset });

    const query = `
          -- Precompute the current user's accepted friends once
          WITH current_friends AS (
            SELECT
              CASE
                WHEN requester_id = $1 THEN receiver_id
                ELSE requester_id
              END AS friend_id
            FROM friendships
            WHERE status = 'accepted'
              AND ($1 = requester_id OR $1 = receiver_id)
          ),
      
          -- Candidate users matching the search
          search_users AS (
            SELECT u.*
            FROM users u
            WHERE u.id <> $1
              AND u.is_verified = true
              AND (
                u.username ILIKE $2
                OR u.first_name ILIKE $2
                OR u.last_name ILIKE $2
                OR (u.first_name || ' ' || u.last_name) ILIKE $2
              )
          )
      
          SELECT
            su.id,
            su.username,
            su.first_name,
            su.last_name,
            su.profile_image_url,
            su.bio,
            COALESCE(mutual_count.count, 0)::INT AS mutual_friends_count,
            -- is_friend / has_pending_request via left-joined friendship rows
            CASE WHEN fa.id IS NOT NULL THEN true ELSE false END AS is_friend,
            CASE WHEN fp.id IS NOT NULL THEN true ELSE false END AS has_pending_request
          FROM search_users su
      
          -- Count mutual friends by joining searched user's accepted friends to current_friends:
          LEFT JOIN LATERAL (
            SELECT COUNT(*) AS count
            FROM (
              SELECT
                CASE
                  WHEN f.requester_id = su.id THEN f.receiver_id
                  ELSE f.requester_id
                END AS friend_id
              FROM friendships f
              WHERE f.status = 'accepted'
                AND (f.requester_id = su.id OR f.receiver_id = su.id)
            ) searched_friends
            JOIN current_friends cf USING (friend_id)
          ) mutual_count ON true
      
          -- join to see if the current user and the candidate are accepted friends
          LEFT JOIN friendships fa ON fa.status = 'accepted'
            AND (
              (fa.requester_id = $1 AND fa.receiver_id = su.id)
              OR (fa.requester_id = su.id AND fa.receiver_id = $1)
            )
      
          -- join to see if there is a pending request between current user and candidate
          LEFT JOIN friendships fp ON fp.status = 'pending'
            AND (
              (fp.requester_id = $1 AND fp.receiver_id = su.id)
              OR (fp.requester_id = su.id AND fp.receiver_id = $1)
            )
      
          ORDER BY mutual_friends_count DESC, su.username ASC
          LIMIT $3 OFFSET $4
        `;

    const searchPattern = `%${searchTerm}%`;
    const result = await DatabaseConnection.query(query, [
      currentUserId,
      searchPattern,
      limit,
      offset,
    ]);

    logger.debug("User search completed", {
      resultCount: result.rows.length,
      searchTerm,
    });

    return result.rows;
  }


  /**
   * Record a user search in the recent_user_searches table
   * @param searcherId - ID of the user performing the search
   * @param searchedUserId - ID of the user being searched
   * @returns Promise<void>
   */
  static async recordUserSearch(searcherId: string, searchedUserId: string): Promise<void> {
    try {
      await DatabaseConnection.query(
        `INSERT INTO recent_user_searches (searcher_id, searched_user_id, searched_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP)
          ON CONFLICT (searcher_id, searched_user_id)
          DO UPDATE SET searched_at = CURRENT_TIMESTAMP;
          `,
        [searcherId, searchedUserId]
      );
    } catch (error) {
      logger.error("Error recor ding user search", { error });
      throw error;
    }
  }


  /**
   * Get recent user searches for a user
   * @param userId - ID of the user to get recent searches for
   * @returns Promise<UserSearch[]>
   */
  static async getRecentUserSearches(userId: string, offset: number = 0, limit: number = 10) {
    const query = `
      SELECT 
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.profile_image_url,
        rs.searched_at
      FROM recent_user_searches rs
      JOIN users u ON rs.searched_user_id = u.id
      WHERE rs.searcher_id = $1
      ORDER BY rs.searched_at DESC
      LIMIT $2 OFFSET $3;
      `;
    const result = await DatabaseConnection.query(query, [userId, limit, offset]);
    return result.rows;
  }

  static async deleteRecentUserSearch(searcherId: string, searchedUserId: string): Promise<void> {
    const query = `
      DELETE FROM recent_user_searches WHERE searcher_id = $1 AND searched_user_id = $2;
    `;
    await DatabaseConnection.query(query, [searcherId, searchedUserId]);
  }

  static async deleteAllRecentUserSearches(searcherId: string): Promise<void> {
    const query = `
      DELETE FROM recent_user_searches WHERE searcher_id = $1;
    `;
    await DatabaseConnection.query(query, [searcherId]);
  }
}