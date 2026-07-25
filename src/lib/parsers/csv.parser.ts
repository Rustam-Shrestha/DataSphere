import { readFile } from "node:fs/promises";
import { parse as csvParse } from "csv-parse/sync";

export async function parse(filePath: string): Promise<Record<string, unknown>[]> {
  const content = await readFile(filePath, "utf-8");
  return csvParse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, unknown>[];
}
