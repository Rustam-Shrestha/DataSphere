import type { Request, Response, NextFunction } from "express";
import { updateComplianceRecordSchema } from "./complianceRecords.schema.js";
import { listRecords, getRecord, updateRecord, deleteRecord } from "./complianceRecords.service.js";
import { ok } from "../../utils/response.js";

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 25));
    const search = req.query.search as string | undefined;
    res.json(ok(await listRecords(page, pageSize, search)));
  } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(ok(await getRecord(req.params.id as string)));
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateComplianceRecordSchema.parse(req.body);
    res.json(ok(await updateRecord(req.params.id as string, body)));
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await deleteRecord(req.params.id as string);
    res.json(ok({ deleted: true }));
  } catch (err) { next(err); }
}
