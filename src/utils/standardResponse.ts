import { Response } from "express";

export type SuccessResponse<T> = {
  ResponseCode: number;
  ResponseMessage: string;
  Data: T;
};

export type ErrorResponse = {
  ResponseCode: number;
  ResponseMessage: string;
  Error: unknown;
};

export class StandardResponse {
  static success<T>(res: Response, data: T, message: string = 'Success', code: number = 200) {
    return res.status(code).json({
      ResponseCode: code,
      ResponseMessage: message,
      Data: data,
    } as SuccessResponse<T>);
  }

  static internalServerError(res: Response, message: string, error: unknown = null, code: number = 500) {
    return res.status(code).json({
      ResponseCode: code,
      ResponseMessage: message,
      Error: error,
    } as ErrorResponse);
  }

  static notFound(res: Response, message: string = 'Not Found', error: unknown = null) {
    return res.status(404).json({
      ResponseCode: 404,
      ResponseMessage: message,
      Error: error,
    } as ErrorResponse);
  }

  static unauthorized(res: Response, message: string = 'Unauthorized', error: unknown = null) {
    return res.status(401).json({
      ResponseCode: 401,
      ResponseMessage: message,
      Error: error,
    } as ErrorResponse);
  }

  static forbidden(res: Response, message: string = 'Forbidden', error: unknown = null) {
    return res.status(403).json({
      ResponseCode: 403,
      ResponseMessage: message,
      Error: error,
    } as ErrorResponse);
  }

  static badRequest(res: Response, message: string = 'Bad Request', error: unknown = null) {
    return res.status(400).json({
      ResponseCode: 400,
      ResponseMessage: message,
      Error: error,
    } as ErrorResponse);
  }
}
