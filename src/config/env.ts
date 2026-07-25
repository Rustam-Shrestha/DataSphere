import { config } from "dotenv";
config();

import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(1),
  PORT: z.coerce.number().default(4000),
  UPLOAD_DIR: z.string().default("./uploads"),
  NLU_SERVICE_URL: z.string().default("http://localhost:8000"),
  GEMINI_API_KEY: z.string().default(""),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
