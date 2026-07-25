import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../utils/response.js";

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; role: string };
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError(401, "UNAUTHORIZED", "Missing or invalid authorization header");
  }
  const token = header.split(" ")[1]!;
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string; role: string };
    req.user = payload;
    next();
  } catch {
    throw new AppError(401, "UNAUTHORIZED", "Invalid or expired token");
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    const token = header.split(" ")[1]!;
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string; role: string };
      req.user = payload;
    } catch {
      // ignore invalid tokens for optional auth
    }
  }
  next();
}
