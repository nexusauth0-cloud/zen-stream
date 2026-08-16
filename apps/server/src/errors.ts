import type { NextFunction, Request, Response } from "express";

export interface ApiErrorShape {
  error: {
    code: string;
    message: string;
  };
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }

  toBody(): ApiErrorShape {
    return {
      error: {
        code: this.code,
        message: this.message,
      },
    };
  }
}

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(new ApiError(404, "NOT_FOUND", "The requested resource does not exist."));
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const apiError =
    error instanceof ApiError
      ? error
      : new ApiError(500, "INTERNAL_ERROR", "An unexpected error occurred.");

  res.status(apiError.status).json(apiError.toBody());
}
