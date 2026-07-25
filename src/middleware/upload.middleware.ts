import multer from "multer";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env.js";
import { AppError } from "../utils/response.js";

const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv", ".mdb", ".accdb"];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, env.UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new AppError(400, "INVALID_FILE_TYPE", `Unsupported file type: ${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`));
  }
}

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
}).single("file");
