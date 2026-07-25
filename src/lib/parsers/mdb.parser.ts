import { readFileSync } from "node:fs";

export async function parse(filePath: string): Promise<Record<string, unknown>[]> {
  const { default: MDBReader } = await import("mdb-reader");
  const buffer = readFileSync(filePath);
  const reader = new MDBReader(buffer);
  const tables = reader.getTableNames();
  if (tables.length === 0) return [];
  const table = reader.getTable(tables[0]!);
  return table.getData() as Record<string, unknown>[];
}
