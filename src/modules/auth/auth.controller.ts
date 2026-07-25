import type { Request, Response, NextFunction } from "express";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { register, login } from "./auth.service.js";
import { ok } from "../../utils/response.js";

export async function registerHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const body = registerSchema.parse(req.body);
    const result = await register(body.email, body.password);
    res.status(201).json(ok(result));
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const body = loginSchema.parse(req.body);
    const result = await login(body.email, body.password);
    res.json(ok(result));
  } catch (err) {
    next(err);
  }
}
