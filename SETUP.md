# DataSphere Compliance Manager — Setup Guide

## Overview

This project is a compliance management system with three components:

| Component | Tech | Port |
|-----------|------|------|
| **Backend API** | Node.js (Express + Prisma) | `4000` |
| **Frontend UI** | React + Vite + Tailwind | `5173` (dev) / served by backend (prod) |
| **NLU Service** | Python (FastAPI + spaCy) | `8000` |

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | v24.14.0 |
| npm | 11.9.0 |
| Python | 3.11.0 |
| PostgreSQL | 18.4 |

---

## What Was Configured

### 1. Environment Variables (`.env`)

Created at project root with:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres:admin@localhost:5432/compliance_db?schema=public` |
| `JWT_SECRET` | `datasphere-jwt-secret-2026` |
| `PORT` | `4000` |
| `UPLOAD_DIR` | `./uploads` |
| `NLU_SERVICE_URL` | `http://localhost:8000` |
| `GEMINI_API_KEY` | `AIzaSyCISyPYllOeDCkugyHMGiQYDSgDh7rZJzA` |
| `NODE_ENV` | `development` |

### 2. NLU Service Environment (`nlu-service/.env`)

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres:admin@localhost:5432/compliance_db?schema=public` |
| `PORT` | `8000` |

### 3. Database (`compliance_db`)

Tables created via Prisma schema push:

- **`User`** — authentication (email, password hash, role)
- **`UploadedFile`** — imported file tracking with SHA-256 checksum dedup
- **`ComplianceRecord`** — compliance test data (store info, test dates/statuses, certificates)

### 4. Prisma Configuration (`prisma.config.ts`)

Prisma v7 requires a `prisma.config.ts` file for CLI commands. This was created with the database connection URL.

### 5. Frontend Build (`client/dist/`)

React app built with Vite into `client/dist/` — served as static files by the Express backend.

### 6. Python Virtual Environment (`nlu-service/.venv/`)

Python packages installed:

| Package | Version |
|---------|---------|
| fastapi | 0.115.0 |
| uvicorn | 0.30.0 |
| spacy | 3.8.0 |
| en_core_web_sm | 3.8.0 |
| pydantic | 2.9.0 |
| psycopg2-binary | 2.9.9 |
| python-dotenv | 1.0.1 |
| dateparser | 1.2.0 |
| rapidfuzz | 3.9.0 |

---

## How to Start

### Option A: Start Everything (Production Mode)

```bash
# Using the batch script:
start.bat
```

This launches:
- **Backend** → `npx tsx src/server.ts` → http://localhost:4000
- **NLU Service** → `uvicorn app.main:app` → http://localhost:8000

### Option B: Start Individually (Dev Mode)

**Terminal 1 — Backend:**
```bash
npm run dev
```

**Terminal 2 — Frontend (dev server with HMR):**
```bash
cd client
npm run dev
```
Then open http://localhost:5173

**Terminal 3 — NLU Service:**
```bash
nlu-service\.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Register a user |
| `POST` | `/api/auth/login` | Login, get JWT token |
| `POST` | `/api/uploads` | Upload Excel/CSV file |
| `GET` | `/api/uploads` | List uploads |
| `GET` | `/api/records` | List records (paginated) |
| `GET` | `/api/records/:id` | Get single record |
| `PATCH` | `/api/records/:id` | Update a record |
| `DELETE` | `/api/records/:id` | Delete a record |
| `POST` | `/api/chatbot/query` | Query via NLU service or Gemini |
| `POST` | `/nlu/query` | (NLU Service) Process natural language query |

---

## File Structure

```
DataSphere/
├── .env                          # Environment variables
├── prisma.config.ts              # Prisma v7 config
├── prisma/
│   └── schema.prisma             # Database schema
├── src/                          # Backend TypeScript source
│   ├── config/
│   │   ├── db.ts                 # Prisma client setup
│   │   └── env.ts                # Env validation (zod)
│   ├── modules/
│   │   ├── auth/                 # Auth (register, login, JWT)
│   │   ├── chatbot/              # Chatbot (NLU + Gemini)
│   │   ├── complianceRecords/    # CRUD for records
│   │   └── uploads/              # File upload & import
│   ├── middleware/               # Auth, error, upload middleware
│   ├── app.ts                    # Express app setup
│   └── server.ts                 # Server entry point
├── client/                       # React frontend
│   ├── src/
│   │   ├── pages/                # Upload, Data, Chat, Dashboard
│   │   ├── components/           # UI components
│   │   ├── lib/                  # API client, store
│   │   └── App.tsx               # Root component with routes
│   └── dist/                     # Production build output
├── nlu-service/                  # Python NLU service
│   ├── .env                      # NLU service env vars
│   ├── .venv/                    # Python virtual environment
│   ├── requirements.txt          # Python dependencies
│   └── app/
│       ├── main.py               # FastAPI app
│       ├── config.py             # Env config
│       ├── db.py                 # DB connection
│       ├── schemas.py            # Pydantic schemas
│       └── nlu/
│           ├── pipeline.py       # NLU query pipeline
│           ├── intents.py        # Intent classification
│           ├── entities.py       # Entity extraction
│           └── templates.py      # SQL templates
├── uploads/                      # Uploaded files storage
├── start.bat                     # Starts both backend + NLU
└── setup.bat                     # Full setup script
```

---

## Database Schema

```
User
├── id (UUID, PK)
├── email (unique)
├── passwordHash
├── role (ADMIN | USER)
└── createdAt

UploadedFile
├── id (UUID, PK)
├── filename
├── storedPath
├── fileType
├── checksum (SHA-256, unique)
├── rowsImported
└── importedAt

ComplianceRecord
├── id (UUID, PK)
├── storeNumber
├── city
├── streetName
├── facilityId
├── channelOfTrade
├── deliveryCertificateExpiredDate
├── insuranceExpiredDate
├── corrosionTestDate / Status
├── spillBucketsTestDate / Status
├── overfillProtectionDeviceTestDate / Status
├── lldLineTightnessTestDate / Status
├── atgProbesTestDate / Status
├── sumpTestDate / Status
├── stage1TestDate / Status
├── uploadedFileId (FK → UploadedFile)
├── createdAt
└── updatedAt
```

---

## Key Fixes Applied

1. **Prisma v7 compatibility** — Added `prisma.config.ts` because Prisma v7 requires a config file for CLI commands (the `url` property is no longer supported in `schema.prisma`).

2. **Frontend build** — Built the React app so the backend can serve `client/dist/index.html`.

3. **Graceful error handling** — Updated `app.ts` catch-all route to check if `index.html` exists before sending it, preventing ENOENT crashes when the frontend isn't built yet.
