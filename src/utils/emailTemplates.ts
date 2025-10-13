export type EmailType = 'verify' | 'forgotpassword';

export interface EmailTemplateData {
    subject: string;
    intro: string;
    purpose: string;
    fallbackText: string;
}

export class EmailTemplates {
    /**
     * Gets email template data based on type
     * @param type - Type of email (verify, forgotpassword)
     * @param otp - The OTP code
     * @returns EmailTemplateData
     */
    static getTemplateData(type: EmailType, otp: string): EmailTemplateData {
        switch (type) {
            case 'verify':
                return {
                    subject: 'Verify your Linkup Account',
                    intro: 'Verify your Linkup Account',
                    purpose: 'Use the code below to verify your Linkup account. This code is valid for a limited time only.',
                    fallbackText: `Your Linkup verification code is: ${otp}\n\nIf you did not request this code, please ignore this email.`
                };
            case 'forgotpassword':
                return {
                    subject: 'Reset your Linkup Password',
                    intro: 'Password Reset Code',
                    purpose: 'Use the code below to reset your Linkup account password. This code is valid for a limited time only.',
                    fallbackText: `Your Linkup password reset code is: ${otp}\n\nIf you did not request a password reset, please ignore this email.`
                };
            default:
                return {
                    subject: 'Your Linkup OTP Code',
                    intro: 'Your One-Time Passcode (OTP)',
                    purpose: 'Use the code below to complete your operation. This code is valid for a limited time only.',
                    fallbackText: `Your OTP code is: ${otp}\n\nIf you did not request this code, please ignore this email.`
                };
        }
    }

    /**
     * Generates HTML email template for OTP
     * @param templateData - Email template data
     * @param otp - The OTP code
     * @returns string - HTML email template
     */
    static generateOtpHtmlTemplate(templateData: EmailTemplateData, otp: string): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width:420px; margin:auto; padding:28px; border-radius:14px; background:#f5f3ff; box-shadow:0 0 28px rgba(180,160,255,0.25); border:1px solid #e9d8fd;">
                <div style="text-align:center; margin-bottom:24px;">
                    <img src="https://res.cloudinary.com/dd6jffzxq/image/upload/v1760367247/LinkUp_bg_erased_af9j3j.png" 
                        alt="Linkup Logo" 
                        style="width:150px; height:150px; display:block; margin:auto; border-radius:10px;">
                </div>
                <h2 style="color:#4b0082; margin:0 0 16px 0; font-size:24px; font-weight:700; text-align:center;">
                    ${templateData.intro}
                </h2>
                <p style="font-size:16px; color:#3b0764; margin:0 0 24px 0; line-height:1.6; text-align:center;">
                    ${templateData.purpose}
                </p>
                <div style="display: flex; flex-direction: column; align-items: center; margin:24px 0;">
                    <div style="font-size:2.2em; letter-spacing:8px; background:#faf5ff; width:max-content; margin:0 auto; padding:20px 40px; border-radius:12px; border:2px solid #d8b4fe; color:#4b0082; font-weight:700; font-family:'Courier New', monospace; box-shadow:0 2px 8px rgba(120,70,200,0.1);">
                        ${otp}
                    </div>
                </div>
                <p style="font-size:14px; color:#6b21a8; margin:24px 0 0 0; line-height:1.6; text-align:center;">
                    If you didn’t request this code, you can safely ignore this email.
                </p>
                <hr style="margin:24px 0; border:none; height:1px; background:#e9d5ff;">
                <div style="font-size:12px; color:#a78bfa; text-align:center;">
                    &copy; ${new Date().getFullYear()} Linkup
                </div>
            </div>
        `;
    }

    /**
     * Generates complete email data for OTP emails
     * @param to - Recipient email address
     * @param otp - The OTP code
     * @param type - Type of email
     * @returns Object with email data
     */
    static generateOtpEmailData(to: string, otp: string, type: EmailType) {
        const templateData = this.getTemplateData(type, otp);
        const html = this.generateOtpHtmlTemplate(templateData, otp);

        return {
            to,
            subject: templateData.subject,
            html,
            text: templateData.fallbackText
        };
    }
}
