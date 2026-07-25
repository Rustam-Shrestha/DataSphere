import { Router } from "express";
import { query } from "./chatbot.controller.js";

const router = Router();

router.post("/query", query);

export default router;
