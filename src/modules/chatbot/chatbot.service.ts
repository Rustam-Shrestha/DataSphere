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

export async function askNlu(question: string): Promise<{
  intent: string;
  answer: string;
  sql: string;
  rows: Record<string, unknown>[];
  chart: Record<string, unknown> | null;
}> {
  const res = await fetch(`${env.NLU_SERVICE_URL}/nlu/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    throw new AppError(502, "NLU_ERROR", `NLU service returned ${res.status}`);
  }
  return res.json() as Promise<{
    intent: string;
    answer: string;
    sql: string;
    rows: Record<string, unknown>[];
    chart: Record<string, unknown> | null;
  }>;
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
        contents: [{
          parts: [{
            text: `You are a compliance data assistant. Answer the following question about compliance test records.
The database has a ComplianceRecord table with these columns:
- storeNumber (int), city (string), streetName (string), facilityId (int)
- channelOfTrade (string)
- deliveryCertificateExpiredDate, insuranceExpiredDate (dates)
- Test pairs (Date + Status) for: corrosion, spillBuckets, overfillProtectionDevice, lldLineTightness, atgProbes, sump, stage1

Question: ${question}

Answer concisely based on what you know about compliance data management. If the user asks about specific records, tell them to use the Data page to browse records. For statistics, guide them to the Dashboard.`,
          }],
        }],
      }),
    },
  );

  if (!res.ok) {
    const errBody = await res.text();
    throw new AppError(502, "GEMINI_ERROR", `Gemini API error: ${errBody}`);
  }

  const data = await res.json() as GeminiResponse;
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
  return {
    intent: "gemini",
    answer: text,
    sql: "",
    rows: [],
    chart: null,
  };
}
