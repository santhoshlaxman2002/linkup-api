import { Schema } from "express-validator";

export class UserValidator {
    // No specific validators needed for search endpoint
    // Search term validation is done in controller

    public static getRecentUserSearchesSchema: Schema = {
        limit: {
            in: "query",
            isInt: true,
            optional: true
        },
        offset: {
            in: "query",
            isInt: true,
            optional: true
        }
    };

    public static deleteRecentUserSearchSchema: Schema = {
        searchedUserId: {
            in: "params",
            isUUID: true,
        }
    };
}