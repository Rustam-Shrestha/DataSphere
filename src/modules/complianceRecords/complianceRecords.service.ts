import { prisma } from "../../config/db.js";
import { AppError } from "../../utils/response.js";

export async function listRecords(page: number, pageSize: number, search?: string) {
  const where: Record<string, unknown> = {};
  if (search) {
    const num = parseInt(search);
    where.OR = [
      { city: { contains: search, mode: "insensitive" } },
      { streetName: { contains: search, mode: "insensitive" } },
      ...(isNaN(num) ? [] : [{ storeNumber: num }]),
    ];
  }
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    prisma.complianceRecord.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.complianceRecord.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function getRecord(id: string) {
  const record = await prisma.complianceRecord.findUnique({ where: { id } });
  if (!record) throw new AppError(404, "NOT_FOUND", "Record not found");
  return record;
}

export async function deleteRecord(id: string) {
  const existing = await prisma.complianceRecord.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "NOT_FOUND", "Record not found");
  await prisma.complianceRecord.delete({ where: { id } });
}

function parseDate(val: string | null | undefined): Date | null | undefined {
  if (val === null || val === undefined) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export async function updateRecord(
  id: string,
  data: Record<string, unknown>,
) {
  const existing = await prisma.complianceRecord.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "NOT_FOUND", "Record not found");

  const updateData: Record<string, unknown> = {};
  const dateFields = [
    "deliveryCertificateExpiredDate", "insuranceExpiredDate",
    "corrosionTestDate", "spillBucketsTestDate",
    "overfillProtectionDeviceTestDate", "lldLineTightnessTestDate",
    "atgProbesTestDate", "sumpTestDate", "stage1TestDate",
  ];

  for (const [k, v] of Object.entries(data)) {
    if (dateFields.includes(k)) {
      updateData[k] = parseDate(v as string | null | undefined);
    } else {
      updateData[k] = v;
    }
  }

  return prisma.complianceRecord.update({ where: { id }, data: updateData });
}
