import { Router } from "express";
import { getAll, getById, update, remove } from "./complianceRecords.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/", getAll);
router.get("/:id", getById);
router.patch("/:id", requireAuth, update);
router.delete("/:id", requireAuth, remove);

export default router;
