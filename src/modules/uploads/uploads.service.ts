import crypto from "node:crypto";
import { createReadStream } from "node:fs";
import { prisma } from "../../config/db.js";
import { parseFile } from "../../lib/parsers/index.js";
import { excelSerialToDate } from "../../lib/parsers/excel.parser.js";
import { AppError } from "../../utils/response.js";

const FIXED_COLUMNS = [
  "Store#", "CITY", "Street Name", "Facility ID#", "Channel Of Trade",
  "Delivery Certificate Expired Date", "Insurance Expired Date",
  "Corrosion Test Date", "Corrosion Test Status",
  "Spill Buckets Test Date", "Spill Bucket Test Status",
  "Overfill Protection Device Test Date", "Overfill Protection Device Test Status",
  "LLD / Line Tightness Test Date", "LLD / Line Tightness Test Status",
  "ATG / Probes Test Date", "ATG / Probes Test Status",
  "SumpTest Date", "Sump Test Status",
  "Stage 1 Test Date", "Stage 1 Test Status",
];

function parseDate(val: unknown): Date | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") {
    if (val > 30000) return excelSerialToDate(val);
    if (val < 100) return null;
  }
  const s = String(val).trim();
  if (!s || s === "0" || s === "#N/A" || s === "N/A" || s === "N/a") return null;
  const n = Number(s);
  if (!isNaN(n) && n > 30000) return excelSerialToDate(n);
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d;
  return null;
}

function parseStatus(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  if (!s || s === "#N/A" || s === "N/A" || s === "N/a" || s === "INCR" || s === "New") return null;
  if (s === "Pass" || s === "PASS") return "PASS";
  if (s === "Fail") return "FAIL";
  const n = Number(s);
  if (!isNaN(n)) return s;
  return s;
}

const COLUMN_ALIAS: Record<string, string> = {
  "store#": "storeNumber",
  "store": "storeNumber",
  "city": "city",
  "street name": "streetName",
  "street": "streetName",
  "facility id#": "facilityId",
  "facility id": "facilityId",
  "facilityid": "facilityId",
  "channel of trade": "channelOfTrade",
  "delivery certificate expired date": "deliveryCertificateExpiredDate",
  "insurance expired date": "insuranceExpiredDate",
  "corrosion test date": "corrosionTestDate",
  "corrosion test status": "corrosionTestStatus",
  "spill buckets test date": "spillBucketsTestDate",
  "spill bucket test status": "spillBucketTestStatus",
  "overfill protection device test date": "overfillProtectionDeviceTestDate",
  "overfill protection device test status": "overfillProtectionDeviceTestStatus",
  "lld / line tightness test date": "lldLineTightnessTestDate",
  "lld / line tightness test status": "lldLineTightnessTestStatus",
  "atg / probes test date": "atgProbesTestDate",
  "atg / probes test status": "atgProbesTestStatus",
  "sumptest date": "sumpTestDate",
  "sump test date": "sumpTestDate",
  "sump test status": "sumpTestStatus",
  "stage 1 test date": "stage1TestDate",
  "stage 1 test status": "stage1TestStatus",
};

interface UploadResult {
  rowsImported: number;
  rowsSkipped: number;
  fileId: string;
}

function computeChecksum(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", (d: Buffer) => hash.update(d));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

export async function importFile(filePath: string, originalName: string): Promise<UploadResult> {
  const ext = originalName.toLowerCase().split(".").pop() || "";
  const checksum = await computeChecksum(filePath);

  const existing = await prisma.uploadedFile.findUnique({ where: { checksum } });
  if (existing) {
    throw new AppError(409, "DUPLICATE_FILE", "This file has already been imported");
  }

  const raw = await parseFile(filePath, "." + ext);
  let rowsImported = 0;
  let rowsSkipped = 0;

  await prisma.$transaction(async (tx) => {
    for (const row of raw) {
      const record: Record<string, unknown> = {};

      for (let [k, v] of Object.entries(row)) {
        const key = k.toLowerCase().trim().replace(/\s+/g, " ");
        const normalizedKey = COLUMN_ALIAS[key];
        if (!normalizedKey) continue;
        record[normalizedKey] = v;
      }

      const storeNumber = parseInt(String(record.storeNumber ?? ""));
      const city = String(record.city ?? "").trim();
      const streetName = String(record.streetName ?? "").trim();

      if (isNaN(storeNumber) || !city || !streetName) {
        rowsSkipped++;
        continue;
      }

      const data = {
        storeNumber,
        city,
        streetName,
        facilityId: record.facilityId ? parseInt(String(record.facilityId)) : null,
        channelOfTrade: record.channelOfTrade ? String(record.channelOfTrade).trim() : null,
        deliveryCertificateExpiredDate: parseDate(record.deliveryCertificateExpiredDate),
        insuranceExpiredDate: parseDate(record.insuranceExpiredDate),
        corrosionTestDate: parseDate(record.corrosionTestDate),
        corrosionTestStatus: parseStatus(record.corrosionTestStatus),
        spillBucketsTestDate: parseDate(record.spillBucketsTestDate),
        spillBucketTestStatus: parseStatus(record.spillBucketTestStatus),
        overfillProtectionDeviceTestDate: parseDate(record.overfillProtectionDeviceTestDate),
        overfillProtectionDeviceTestStatus: parseStatus(record.overfillProtectionDeviceTestStatus),
        lldLineTightnessTestDate: parseDate(record.lldLineTightnessTestDate),
        lldLineTightnessTestStatus: parseStatus(record.lldLineTightnessTestStatus),
        atgProbesTestDate: parseDate(record.atgProbesTestDate),
        atgProbesTestStatus: parseStatus(record.atgProbesTestStatus),
        sumpTestDate: parseDate(record.sumpTestDate),
        sumpTestStatus: parseStatus(record.sumpTestStatus),
        stage1TestDate: parseDate(record.stage1TestDate),
        stage1TestStatus: parseStatus(record.stage1TestStatus),
      };

      await tx.complianceRecord.create({ data });
      rowsImported++;
    }
  });

  const uploadedFile = await prisma.uploadedFile.create({
    data: {
      filename: originalName,
      storedPath: filePath,
      fileType: ext.toUpperCase(),
      checksum,
      rowsImported,
    },
  });

  return { rowsImported, rowsSkipped, fileId: uploadedFile.id };
}

export async function listUploads(page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    prisma.uploadedFile.findMany({ skip, take: pageSize, orderBy: { importedAt: "desc" } }),
    prisma.uploadedFile.count(),
  ]);
  return { items, total, page, pageSize };
}

export async function getUploadRows(id: string) {
  const file = await prisma.uploadedFile.findUnique({ where: { id } });
  if (!file) throw new AppError(404, "NOT_FOUND", "Upload not found");
  const records = await prisma.complianceRecord.findMany({
    where: { uploadedFileId: id },
    orderBy: { createdAt: "desc" },
  });
  return { file, records };
}
