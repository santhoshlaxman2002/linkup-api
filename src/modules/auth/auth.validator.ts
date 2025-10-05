import { DatabaseConnection } from "../../database/DatabaseConnection";
import { Schema } from "express-validator";

export class AuthValidator {
    public static registerSchema: Schema = {
        firstName: {
            in: ["body"],
            notEmpty: {
                errorMessage: "First name is required",
            },
            isLength: {
                options: { min: 2, max: 100 },
                errorMessage: "First name must be between 2 and 100 characters",
            },
            trim: true,
        },
        lastName: {
            in: ["body"],
            notEmpty: {
                errorMessage: "Last name is required",
            },
            isLength: {
                options: { min: 2, max: 100 },
                errorMessage: "Last name must be between 2 and 100 characters",
            },
            trim: true,
        },
        dateOfBirth: {
            in: ["body"],
            notEmpty: {
                errorMessage: "Date of birth is required",
            },
            isISO8601: {
                errorMessage: "Date of birth must be a valid date",
            },
            toDate: true,
        },
        username: {
            in: ["body"],
            notEmpty: {
                errorMessage: "Username is required",
            },
            isLength: {
                options: { min: 3, max: 50 },
                errorMessage: "Username must be between 3 and 50 characters",
            },
            isAlphanumeric: {
                errorMessage: "Username must be alphanumeric",
            },
            trim: true,
            custom: {
                options: async (value) => {
                    const query = `
            SELECT username FROM users WHERE username = $1
          `;
                    const result = await DatabaseConnection.query(query, [value]);
                    if (result.rowCount === 0) {
                        return true;
                    }
                    throw new Error("Username must be unique");
                },
                errorMessage: "Username must be unique",
            },
        },
        email: {
            in: ["body"],
            notEmpty: {
                errorMessage: "Email is required",
            },
            isEmail: {
                errorMessage: "Email must be valid",
            },
            normalizeEmail: true,
            custom: {
                options: async (value) => {
                    const query = `
                        SELECT email FROM users WHERE email = $1
                    `;
                    const result = await DatabaseConnection.query(query, [value]);
                    if (result.rowCount === 0) {
                        return true;
                    }
                    throw new Error("Email must be unique");
                },
                errorMessage: "Email must be unique",
            },
        },
        password: {
            in: ["body"],
            notEmpty: {
                errorMessage: "Password is required",
            },
            isLength: {
                options: { min: 8 },
                errorMessage: "Password must be at least 8 characters",
            },
        },
    }

    public static loginSchema: Schema = {
        loginName: {
            in: ["body"],
            notEmpty: {
                errorMessage: "Email or username is required",
            },
            custom: {
                options: (value) => {
                    // Accept either a valid email or a valid username (alphanumeric, 3-30 chars)
                    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                    const isUsername = /^[a-zA-Z0-9_]{3,30}$/.test(value);
                    if (!isEmail && !isUsername) {
                        throw new Error("Must be a valid email or username");
                    }
                    return true;
                },
                errorMessage: "Must be a valid email or username",
            }
        },
        password: {
            in: ["body"],
            notEmpty: {
                errorMessage: "Password is required",
            },
            isLength: {
                options: { min: 8 },
                errorMessage: "Password must be at least 8 characters",
            },
        },
    };
};
