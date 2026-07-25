# AGENTS.md — Compliance Manager

## What this is
A compliance-record tracker: upload Excel/CSV exports with fixed columns → normalize into flat Postgres table → CRUD + dashboard + natural-language chatbot with two modes (custom NLU or Gemini API).

**No external API calls except Gemini (optional).** No GPU. MVP scope only.

## Two local processes
1. **Node/Express** (`src/`) — CRUD, file upload/parsing, auth, Gemini proxy, serves static frontend. Port 4000.
2. **Python FastAPI** (`nlu-service/`) — rule-based NLU pipeline. Own venv, Python 3.11, CPU-only. Port 8000. Node proxies chatbot queries to it (`fetch(NLU_SERVICE_URL + "/nlu/query")`).

## Stack

**Node side:**
- Node 20+, TypeScript strict, ESM
- Express 5, Prisma (schema pushed via `db push`), zod, jsonwebtoken, bcryptjs, multer
- xlsx, csv-parse for file parsing
- Frontend: plain HTML + vanilla JS ES modules, **D3.js v7 via CDN**

**Python side (`nlu-service/`, venv, Python 3.11):**
- FastAPI + uvicorn
- spaCy `en_core_web_sm` (CPU-only, PERSON name recognition)
- dateparser, rapidfuzz
- psycopg2 (always parameterized SQL)

## Database — Flat Schema

One main table: `ComplianceRecord` with fixed columns matching the import file:

| Column | Type | Notes |
|--------|------|-------|
| storeNumber | Int | From Store# |
| city | String | From CITY |
| streetName | String | From Street Name |
| facilityId | Int? | From Facility ID# |
| channelOfTrade | String? | |
| deliveryCertificateExpiredDate | DateTime? | |
| insuranceExpiredDate | DateTime? | |
| corrosionTestDate / Status | DateTime? / String? | Paired test columns |
| spillBucketsTestDate / Status | DateTime? / String? | |
| overfillProtectionDeviceTestDate / Status | DateTime? / String? | |
| lldLineTightnessTestDate / Status | DateTime? / String? | |
| atgProbesTestDate / Status | DateTime? / String? | |
| sumpTestDate / Status | DateTime? / String? | |
| stage1TestDate / Status | DateTime? / String? | |

Plus `User` (auth) and `UploadedFile` (import tracking).

## Hard rules
1. **No eslint/prettier/webpack/vite.** Validation is `npm run typecheck` only.
2. **No pip packages beyond `nlu-service/requirements.txt`.**
3. **Never touch `prisma/schema.prisma`** unless explicitly told.
4. **One PrismaClient** from `src/config/db.ts`.
5. **Every route validates with zod** before controller body. Uses `{ success: true, data }` / `{ success: false, error }` envelope.
6. **Python NLU never builds SQL by string interpolation.** All queries are fixed templates with `%s` placeholders.
7. **Uploaded files stored with uuid filename** in `uploads/`.
8. **Two chat modes**: `nlu` (Python service) and `gemini` (Gemini API via `GEMINI_API_KEY` in .env).

## Folder structure
```
src/
  server.ts, app.ts
  config/env.ts, config/db.ts
  middleware/auth.middleware.ts, error.middleware.ts, upload.middleware.ts
  lib/parsers/{excel,csv,mdb}.parser.ts, parsers/index.ts
  modules/{auth,uploads,complianceRecords,chatbot}/
    <name>.routes.ts, <name>.controller.ts, <name>.service.ts, <name>.schema.ts
  utils/response.ts, logger.ts
public/
  index.html (Upload), data.html (CRUD), chatbot.html (Chat), dashboard.html
  css/style.css
  js/api.js, upload.js, crud.js, dashboard.js, chatbot.js
uploads/            # gitignored
nlu-service/
  requirements.txt
  .env
  app/{main,config,db,schemas}.py
  app/nlu/{intents,entities,templates,pipeline}.py
```

## Chatbot contract
Frontend → Node: `POST /api/chatbot/query { question, mode }`
Node → Python (mode=nlu): `POST /nlu/query { question }`
Node → Gemini (mode=gemini): Gemini API generateContent

Response shape:
```json
{
  "success": true,
  "data": {
    "intent": "failure_rate",
    "answer": "...",
    "sql": "...",
    "rows": [],
    "chart": { "type": "pie", "labels": [], "values": [] },
    "mode": "nlu"
  }
}
```
