import { Router } from "express";
import { query } from "./chatbot.controller.js";
import { executeRawSql } from "./sql.controller.js";

const router = Router();

router.post("/query", query);
router.post("/sql/execute", executeRawSql);

export default router;
