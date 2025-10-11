import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

interface MailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
};

class Mailer {
    private transporter: nodemailer.Transporter;

    constructor() {
        dotenv.config();
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async sendMail(options: MailOptions): Promise<void> {
        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html
        };

        await this.transporter.sendMail(mailOptions);
    }
}

const mailer = new Mailer();

export const sendMail = async (options: MailOptions) => {
    await mailer.sendMail(options);
};

