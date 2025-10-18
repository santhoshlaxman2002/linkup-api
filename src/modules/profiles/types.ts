// Types for profile module
export interface ProfileUpdateRequest {
    bio?: string;
    mobile_number?: string;
    gender?: string;
    cover_image?: string;
    profile_image_url?: string;
}

export interface ProfileResponse {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    bio?: string;
    mobile_number?: string;
    gender?: string;
    cover_image?: string;
    profile_image_url?: string;
    is_verified: boolean;
    created_at: string;
    updated_at: string;
}
