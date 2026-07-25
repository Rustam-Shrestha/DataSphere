import express from "express";
import helmet from "helmet";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { errorHandler } from "./middleware/error.middleware.js";
import authRoutes from "./modules/auth/auth.routes.js";
import uploadRoutes from "./modules/uploads/uploads.routes.js";
import complianceRecordsRoutes from "./modules/complianceRecords/complianceRecords.routes.js";
import chatbotRoutes from "./modules/chatbot/chatbot.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/api/auth", authRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/records", complianceRecordsRoutes);
app.use("/api/chatbot", chatbotRoutes);

app.use(errorHandler);

export default app;
