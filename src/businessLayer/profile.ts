import { DatabaseConnection } from "../database/DatabaseConnection";
import { ProfileUpdateRequest, ProfileResponse } from "../modules/profiles";

export class ProfileBL {
    /**
     * Get user profile by ID
     */
    static async getProfileById(userId: string): Promise<ProfileResponse | null> {
        const query = `
            SELECT id, username, email, first_name, last_name, date_of_birth, 
                   bio, mobile_number, gender, cover_image, profile_image_url,
                   is_verified, created_at, updated_at
            FROM users
            WHERE id = $1
        `;
        const result = await DatabaseConnection.query(query, [userId]);
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
