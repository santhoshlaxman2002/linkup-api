import { Schema } from "express-validator";

export class ProfileValidator {
    /**
     * Custom validator to check if mobile number format is valid
     */
    public static validateMobileNumber = (value: any) => {
        if (!value) return true; // Optional field
        
        // Basic mobile number validation - adjust regex based on your requirements
        const mobileRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!mobileRegex.test(value)) {
            throw new Error("Invalid mobile number format");
        }
        return true;
    };

    /**
     * Custom validator to check if gender is valid
     */
    public static validateGender = (value: any) => {
        if (!value) return true; // Optional field
        
        const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
        if (!validGenders.includes(value.toLowerCase())) {
            throw new Error("Gender must be one of: male, female, other, prefer_not_to_say");
        }
        return true;
    };

    /**
     * Custom validator to check bio length
     */
    public static validateBio = (value: any) => {
        if (!value) return true; // Optional field
        
        if (value.length > 500) {
            throw new Error("Bio must be less than 500 characters");
        }
        return true;
    };

    /**
     * Custom validator to check if URL is valid (for images)
     */
    public static validateImageUrl = (value: any) => {
        if (!value) return true; // Optional field
        
        try {
            new URL(value);
            return true;
        } catch {
            throw new Error("Invalid image URL format");
        }
    };

    // ----- Schemas -----
    public static updateProfileSchema: Schema = {
        bio: {
            optional: true,
            custom: {
                options: ProfileValidator.validateBio,
                errorMessage: "Bio validation failed",
            },
        },
        mobile_number: {
            optional: true,
            custom: {
                options: ProfileValidator.validateMobileNumber,
                errorMessage: "Mobile number validation failed",
            },
        },
        gender: {
            optional: true,
            custom: {
                options: ProfileValidator.validateGender,
                errorMessage: "Gender validation failed",
            },
        },
        cover_image: {
            optional: true,
            custom: {
                options: ProfileValidator.validateImageUrl,
                errorMessage: "Cover image URL validation failed",
            },
        },
        profile_image_url: {
            optional: true,
            custom: {
                options: ProfileValidator.validateImageUrl,
                errorMessage: "Profile image URL validation failed",
            },
        },
    };
}
