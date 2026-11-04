import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/db.js";
import { ok } from "../../utils/response.js";

// SQL keywords permitted for read-only analytical queries
const ALLOWED_KEYWORDS = /^\s*(SELECT|WITH|EXPLAIN)\b/i;
const FORBIDDEN_KEYWORDS = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|EXEC|EXECUTE)\b/i;

export async function executeRawSql(req: Request, res: Response, next: NextFunction) {
  try {
    const { query: rawQuery } = req.body;

    if (!rawQuery || typeof rawQuery !== "string") {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_QUERY", message: "SQL query must be a non-empty string" },
      });
      return;
    }

    const trimmed = rawQuery.trim();

    if (!ALLOWED_KEYWORDS.test(trimmed)) {
      res.status(400).json({
        success: false,
        error: {
          code: "FORBIDDEN_QUERY",
          message: "Only SELECT queries are allowed for security in SQL Studio.",
        },
      });
      return;
    }

    if (FORBIDDEN_KEYWORDS.test(trimmed)) {
      res.status(400).json({
        success: false,
        error: {
          code: "MUTATION_NOT_ALLOWED",
          message: "Data modification statements (INSERT, UPDATE, DELETE, DROP, etc.) are disabled.",
        },
      });
      return;
    }

    const startTime = performance.now();
    // Execute query safely via Prisma raw query
    const rows: unknown[] = await prisma.$queryRawUnsafe(trimmed);
    const durationMs = Math.round(performance.now() - startTime);

    res.json(
      ok({
        rows,
        rowCount: Array.isArray(rows) ? rows.length : 0,
        executionTimeMs: durationMs,
      })
    );
  } catch (err: unknown) {
    const error = err as Error;
    res.status(400).json({
      success: false,
      error: {
        code: "SQL_EXECUTION_ERROR",
        message: error.message || "Failed to execute SQL query",
      },
    });
  }
}

