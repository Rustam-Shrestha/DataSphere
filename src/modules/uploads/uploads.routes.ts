import { Router } from "express";
import { uploadMiddleware } from "../../middleware/upload.middleware.js";
import { uploadFile, getUploads } from "./uploads.controller.js";

const router = Router();

router.post("/", uploadMiddleware, uploadFile);
router.get("/", getUploads);

export default router;
