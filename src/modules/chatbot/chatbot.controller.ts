import type { Request, Response, NextFunction } from "express";
import { askNlu, askGemini } from "./chatbot.service.js";
import { ok } from "../../utils/response.js";

interface ChatResult {
  intent: string;
  answer: string;
  sql: string;
  rows: Record<string, unknown>[];
  chart: Record<string, unknown> | null;
}

export async function query(req: Request, res: Response, next: NextFunction) {
  try {
    const { question, mode } = req.body;
    if (!question || typeof question !== "string") {
      res.status(400).json({ success: false, error: { code: "INVALID_QUESTION", message: "Question must be a non-empty string" } });
      return;
    }

    const chatMode: "gemini" | "nlu" = mode === "gemini" ? "gemini" : "nlu";
    const result: ChatResult = chatMode === "gemini" ? await askGemini(question) : await askNlu(question);
    res.json(ok({ ...result, mode: chatMode }));
  } catch (err) {
    next(err);
  }
}
