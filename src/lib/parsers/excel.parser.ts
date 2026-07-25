import XLSX from "xlsx";

function excelSerialToDate(serial: number): Date {
  const epoch = new Date(1900, 0, 1);
  return new Date(epoch.getTime() + (serial - 2) * 86400000);
}

export async function parse(filePath: string): Promise<Record<string, unknown>[]> {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]!];
  if (!ws) return [];

  const range = XLSX.utils.decode_range(ws["!ref"]!);
  const rows: Record<string, unknown>[] = [];
  const headers: string[] = [];

  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: range.s.r, c });
    const cell = ws[addr];
    headers.push(cell ? String(cell.v).trim() : "");
  }

  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const row: Record<string, unknown> = {};
    for (let c = 0; c < headers.length; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (!cell) continue;
      if (cell.t === "e") continue;
      if (cell.t === "n") {
        row[headers[c]!] = cell.v;
      } else {
        row[headers[c]!] = String(cell.v).trim();
      }
    }
    rows.push(row);
  }

  return rows;
}

export { excelSerialToDate };
