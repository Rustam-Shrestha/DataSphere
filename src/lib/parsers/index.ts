import { parse as parseExcel } from "./excel.parser.js";
import { parse as parseCsv } from "./csv.parser.js";
import { parse as parseMdb } from "./mdb.parser.js";
import { AppError } from "../../utils/response.js";

export async function parseFile(filePath: string, ext: string): Promise<Record<string, unknown>[]> {
  switch (ext) {
    case ".xlsx":
    case ".xls":
      return parseExcel(filePath);
    case ".csv":
      return parseCsv(filePath);
    case ".mdb":
    case ".accdb":
      return parseMdb(filePath);
    default:
      throw new AppError(400, "UNSUPPORTED_PARSER", `No parser available for extension: ${ext}`);
  }
}
