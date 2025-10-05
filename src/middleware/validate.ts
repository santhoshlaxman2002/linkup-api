import { Request, Response, NextFunction } from "express";
import { checkSchema, validationResult, Schema } from "express-validator";
import { logger, StandardResponse } from "../utils";

// Class-based validator middleware
export class Validator {
  // Static method to return validation middleware array
  public static validate(schema: Schema) {
    const validators = checkSchema(schema);

    return [
      ...validators,
      (req: Request, res: Response, next: NextFunction) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          return next();
        }

         // Format errors like: [body.email]: "Email must be unique"
         const formatted: Record<string, string> = {};
         for (const err of result.array({ onlyFirstError: true })) {
           const location = (err as any).location ?? (err as any).loc ?? "unknown";
           const path = (err as any).path ?? (err as any).param ?? "unknown";
           const key = `[${location}.${path}]`;
           formatted[key] = err.msg as string;
         }

        logger.warn("Validation failed", { path: req.path, errors: formatted });
        return StandardResponse.badRequest(res, "Validation Error", formatted);
      },
    ];
  }
}
