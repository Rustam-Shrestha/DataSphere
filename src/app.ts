import express from "express";
import helmet from "helmet";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
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
app.use(express.static(path.join(__dirname, "..", "client", "dist")));
app.use(express.static(path.join(__dirname, "..", "client", "public")));

app.use("/api/auth", authRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/records", complianceRecordsRoutes);
app.use("/api/chatbot", chatbotRoutes);

const indexHtml = path.join(__dirname, "..", "client", "dist", "index.html");

app.get("/{*splat}", (_req, res) => {
  if (fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.status(200).json({
      success: true,
      message: "Backend API is running. Frontend is being served via Vite dev server (http://localhost:5173) or build the client with: cd client && npm run build",
    });
  }
});

app.use(errorHandler);

export default app;
