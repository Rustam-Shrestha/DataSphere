import type { Request, Response, NextFunction } from "express";
import { importFile, listUploads, getUploadRows } from "./uploads.service.js";
import { ok } from "../../utils/response.js";

export async function uploadFile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: { code: "NO_FILE", message: "No file provided" } });
      return;
    }
    const result = await importFile(req.file.path, req.file.originalname);
    res.status(201).json(ok(result));
  } catch (err) {
    next(err);
  }
}

export async function getUploads(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 25));
    const result = await listUploads(page, pageSize);
    res.json(ok(result));
  } catch (err) {
    next(err);
  }
}

export async function getUploadById(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await getUploadRows(req.params.id as string);
    res.json(ok(result));
  } catch (err) {
    next(err);
  }
}
