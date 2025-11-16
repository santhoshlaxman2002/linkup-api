import { DatabaseConnection } from "../database/DatabaseConnection";
import { ProfileUpdateRequest, ProfileResponse } from "../modules/profiles";

export class ProfileBL {
    /**
     * Get user profile by ID
     */
    static async getProfileById(
        userId: string,
        loggedInUserId: string
    ): Promise<ProfileResponse | null> {
        const query = `
            WITH 
            user_friends AS (
              SELECT
                CASE 
                  WHEN requester_id = $1 THEN receiver_id
                  ELSE requester_id
                END AS friend_id
              FROM friendships
              WHERE status = 'accepted'
                AND ($1 = requester_id OR $1 = receiver_id)
            ),
            logged_user_friends AS (
              SELECT
                CASE 
                  WHEN requester_id = $2 THEN receiver_id
                  ELSE requester_id
                END AS friend_id
              FROM friendships
              WHERE status = 'accepted'
                AND ($2 = requester_id OR $2 = receiver_id)
            ),
            friendship_status AS (
              SELECT
                f.id AS friendship_id,
                CASE
                  WHEN f.status = 'accepted' THEN 'accepted'
                  WHEN f.status = 'pending' AND f.requester_id = $2 THEN 'requested'
                  WHEN f.status = 'pending' AND f.receiver_id = $2 THEN 'received'
                  ELSE 'none'
                END AS status
              FROM friendships f
              WHERE 
                (f.requester_id = $1 AND f.receiver_id = $2)
                OR
                (f.requester_id = $2 AND f.receiver_id = $1)
              LIMIT 1
            ),
            mutuals AS (
              SELECT u.id, u.username, u.first_name, u.last_name, u.profile_image_url
              FROM users u
              JOIN user_friends uf ON uf.friend_id = u.id
              JOIN logged_user_friends luf ON uf.friend_id = luf.friend_id
              LIMIT 5
            )
            SELECT 
              u.id,
              u.username,
              u.email,
              u.first_name,
              u.last_name,
              u.date_of_birth,
              u.bio,
              u.mobile_number,
              u.gender,
              u.cover_image,
              u.profile_image_url,
              u.is_verified,
              u.created_at,
              u.updated_at,
              -- total friends
              (SELECT COUNT(*) 
              FROM friendships f
              WHERE f.status = 'accepted'
                AND (f.requester_id = u.id OR f.receiver_id = u.id)
              ) AS total_friends_count,
              -- mutual friend count
              CASE 
                WHEN u.id <> $2 THEN (
                  SELECT COUNT(*) 
                  FROM user_friends uf
                  JOIN logged_user_friends luf ON uf.friend_id = luf.friend_id
                )
                ELSE 0
              END AS mutual_friends_count,
              -- top 5 mutual friends (JSON array)
              CASE 
                WHEN u.id <> $2 THEN (
                  SELECT json_agg(
                    json_build_object(
                      'id', m.id,
                      'username', m.username,
                      'first_name', m.first_name,
                      'last_name', m.last_name,
                      'profile_image_url', m.profile_image_url
                    )
                  )
                  FROM mutuals m
                )
                ELSE '[]'::json
              END AS mutual_friends,

              -- friendship relationship
              COALESCE(
                (SELECT status FROM friendship_status),
                'none'
              ) AS friendship_status,
              -- friendship id
              (SELECT friendship_id FROM friendship_status) AS friendship_id
            FROM users u
            WHERE u.id = $1;
        `;

        const result = await DatabaseConnection.query(query, [userId, loggedInUserId]);

        if (result.rowCount === 0) return null;

        return result.rows[0];
    }


    /**
     * Update user profile
     */
    static async updateProfile(userId: string, updateData: ProfileUpdateRequest): Promise<ProfileResponse | null> {
        // Build dynamic query based on provided fields
        const fields = [];
        const values = [];
        let paramIndex = 1;

        if (updateData.first_name !== undefined) {
            fields.push(`first_name = $${paramIndex}`);
            values.push(updateData.first_name);
            paramIndex++;
        }

        if (updateData.last_name !== undefined) {
            fields.push(`last_name = $${paramIndex}`);
            values.push(updateData.last_name);
            paramIndex++;
        }

        if (updateData.date_of_birth !== undefined) {
            fields.push(`date_of_birth = $${paramIndex}`);
            values.push(updateData.date_of_birth);
            paramIndex++;
        }

        if (updateData.bio !== undefined) {
            fields.push(`bio = $${paramIndex}`);
            values.push(updateData.bio);
            paramIndex++;
        }

        if (updateData.mobile_number !== undefined) {
            fields.push(`mobile_number = $${paramIndex}`);
            values.push(updateData.mobile_number);
            paramIndex++;
        }

        if (updateData.gender !== undefined) {
            fields.push(`gender = $${paramIndex}`);
            values.push(updateData.gender);
            paramIndex++;
        }

        if (updateData.cover_image !== undefined) {
            fields.push(`cover_image = $${paramIndex}`);
            values.push(updateData.cover_image);
            paramIndex++;
        }

        if (updateData.profile_image_url !== undefined) {
            fields.push(`profile_image_url = $${paramIndex}`);
            values.push(updateData.profile_image_url);
            paramIndex++;
        }

        // Always update the updated_at timestamp
        fields.push(`updated_at = CURRENT_TIMESTAMP`);

        if (fields.length === 1) {
            // Only updated_at field, no actual profile data to update
            throw new Error("No profile data provided for update");
        }

        const query = `
            UPDATE users 
            SET ${fields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING id, username, email, first_name, last_name, date_of_birth,
                      bio, mobile_number, gender, cover_image, profile_image_url,
                      is_verified, created_at, updated_at
        `;

        values.push(userId);
        const result = await DatabaseConnection.query(query, values);

        if (result.rowCount === 0) return null;
        return result.rows[0];
    }
}
