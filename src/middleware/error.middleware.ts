import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/response.js";
import { logger } from "../utils/logger.js";

export function errorHandler(
  err: Error & { status?: number; expose?: boolean },
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  // body-parser JSON syntax errors
  if (err.status === 400 && err.expose) {
    res.status(400).json({
      success: false,
      error: { code: "INVALID_JSON", message: err.message },
    });
    return;
  }

  logger.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
  });
}
