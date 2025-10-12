import { DatabaseConnection } from "../database/DatabaseConnection";

export class OtpUtils {
    /**
     * Generates a 6-digit OTP
     * @returns string - 6-digit OTP
     */
    static generateOtp(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Stores OTP in the database with user_id
     * @param userId - ID of the user requesting OTP
     * @param otp - The OTP to store
     * @returns Promise<void>
     */
    static async storeOtp(userId: string, otp: string): Promise<void> {
        await DatabaseConnection.query(
            `INSERT INTO otp_verifications (user_id, otp) VALUES ($1, $2)`,
            [userId, otp]
        );
    }

    /**
     * Validates OTP for a user
     * @param otp - The OTP to validate
     * @param userId - ID of the user
     * @returns Promise<{isValid: boolean, otpId?: string}> - Validation result with OTP ID if valid
     */
    static async validateOtp(otp: string, userId: string): Promise<{isValid: boolean, otpId?: string}> {
        const query = `
            SELECT 
                true as "isValid",
                ov.id
            FROM otp_verifications ov
            WHERE ov.otp = $1
              AND ov.user_id = $2
              AND ov.expires_at > (current_timestamp at time zone 'utc')
              AND ov.is_verified = false
            ORDER BY ov.created_at DESC
            LIMIT 1
        `;

        const result = await DatabaseConnection.query(query, [otp, userId]);
        
        if (result.rowCount === 0 || !result.rows[0].isValid) {
            return { isValid: false };
        }

        return { isValid: true, otpId: result.rows[0].id };
    }

    /**
     * Marks an OTP as verified
     * @param otpId - ID of the OTP verification record
     * @returns Promise<void>
     */
    static async markOtpAsVerified(otpId: string): Promise<void> {
        await DatabaseConnection.query(
            `UPDATE otp_verifications SET is_verified = true WHERE id = $1`,
            [otpId]
        );
    }

    /**
     * Generates and stores OTP for a user
     * @param userId - ID of the user requesting OTP
     * @returns Promise<string> - The generated OTP
     */
    static async generateAndStoreOtp(userId: string): Promise<string> {
        const otp = this.generateOtp();
        await this.storeOtp(userId, otp);
        return otp;
    }
}
