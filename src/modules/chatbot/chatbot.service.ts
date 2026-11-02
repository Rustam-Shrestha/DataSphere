import { env } from "../../config/env.js";
import { AppError } from "../../utils/response.js";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

interface CustomError extends Error {
  code?: string;
}

export async function askNlu(question: string): Promise<{
  intent: string;
  answer: string;
  sql: string;
  rows: Record<string, unknown>[];
  chart: Record<string, unknown> | null;
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(`${env.NLU_SERVICE_URL}/nlu/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new AppError(502, "NLU_ERROR", `NLU service returned status ${res.status}`);
    }
    return (await res.json()) as {
      intent: string;
      answer: string;
      sql: string;
      rows: Record<string, unknown>[];
      chart: Record<string, unknown> | null;
    };
  } catch (err: unknown) {
    const error = err as CustomError;
    if (error.name === "AbortError") {
      throw new AppError(504, "NLU_TIMEOUT", "NLU service timed out (12s). Verify that Python NLU service is running.");
    }
    if (error.code === "ECONNREFUSED" || error.message?.includes("fetch failed")) {
      throw new AppError(503, "NLU_UNAVAILABLE", "Cannot connect to NLU service. Ensure 'python -m app.main' is running on port 8000.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function askGemini(question: string): Promise<{
  intent: string;
  answer: string;
  sql: string;
  rows: Record<string, unknown>[];
  chart: Record<string, unknown> | null;
}> {
  if (!env.GEMINI_API_KEY) {
    throw new AppError(400, "GEMINI_NOT_CONFIGURED", "Gemini API key not configured. Set GEMINI_API_KEY in .env");
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are a compliance data assistant. Answer the following question about fuel station compliance test records.
The database has a ComplianceRecord table with these columns:
- storeNumber (int), city (string), streetName (string), facilityId (int)
- channelOfTrade (string)
- deliveryCertificateExpiredDate, insuranceExpiredDate (dates)
- Test pairs (Date + Status) for: corrosion, spillBuckets, overfillProtectionDevice, lldLineTightness, atgProbes, sump, stage1

Question: ${question}

Answer concisely based on what you know about compliance data management. If the user asks about specific records, tell them to use the Data page to browse records. For statistics, guide them to the Dashboard.`,
              },
            ],
          },
        ],
      }),
    },
  );

  if (!res.ok) {
    const errBody = await res.text();
    throw new AppError(502, "GEMINI_ERROR", `Gemini API error: ${errBody}`);
  }

  const data = (await res.json()) as GeminiResponse;
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
  return {
    intent: "gemini",
    answer: text,
    sql: "",
    rows: [],
    chart: null,
  };
}
