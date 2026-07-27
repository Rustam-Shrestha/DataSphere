# Compliance Manager

A compliance record management system for tracking fuel station inspections and test results. Upload Excel/CSV exports, browse records, and query data via natural language — powered by a custom NLU engine or Gemini AI.

---

## Architecture

| Process | Port | Tech | Purpose |
|---------|------|------|---------|
| **Node Backend** | `4000` | Express 5 + Prisma + PostgreSQL | REST API, file upload, auth, serves frontend, Gemini proxy |
| **React Frontend** | served by backend | React 19 + TanStack Query + Zustand + Tailwind CSS | SPA with 4 pages |
| **NLU Service** | `8000` | FastAPI + psycopg2 + spaCy | Rule-based NLU → SQL conversion |

---

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- PostgreSQL running on `localhost:5432`

### One-step setup

```
setup.bat
```

This installs everything, builds the React frontend, creates the Python venv, and pushes the DB schema.

### Start

```
start.bat
```

Then open **http://localhost:4000**

---

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | **Upload** | Login/register, upload Excel/CSV, view recent uploads |
| `/data` | **Data** | Searchable, paginated table with inline edit/delete modal |
| `/chat` | **Chat** | NL questions with two modes (NLU Engine / Gemini AI) |
| `/dashboard` | **Dashboard** | D3 charts, stats cards, expiry overview |

---

## Chat Modes

### NLU Engine (default)
Rule-based intent classification + entity extraction running locally via Python FastAPI. Understands failure rates, pass/fail counts, store lookups, expiry checks.

### Gemini AI
Requires `GEMINI_API_KEY` in `.env`. Uses Google Gemini 2.0 Flash for open-ended questions about compliance data.

---

## Database

### `ComplianceRecord` (single flat table)

| Column | Type |
|--------|------|
| storeNumber | Int |
| city | String |
| streetName | String |
| facilityId | Int? |
| channelOfTrade | String? |
| deliveryCertificateExpiredDate | DateTime? |
| insuranceExpiredDate | DateTime? |
| corrosionTestDate / Status | DateTime? / String? |
| spillBucketsTestDate / Status | DateTime? / String? |
| overfillProtectionDeviceTestDate / Status | DateTime? / String? |
| lldLineTightnessTestDate / Status | DateTime? / String? |
| atgProbesTestDate / Status | DateTime? / String? |
| sumpTestDate / Status | DateTime? / String? |
| stage1TestDate / Status | DateTime? / String? |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Register |
| POST | `/api/auth/login` | No | Login |
| POST | `/api/uploads` | Yes | Upload file |
| GET | `/api/uploads` | No | List uploads |
| GET | `/api/records` | No | List records (query: page, pageSize, search) |
| GET | `/api/records/:id` | No | Get record |
| PATCH | `/api/records/:id` | Yes | Update record |
| DELETE | `/api/records/:id` | Yes | Delete record |
| POST | `/api/chatbot/query` | No | Chat query `{ question, mode }` |

---

## Tech Stack

- **Frontend:** React 19, TypeScript, TanStack Query, Zustand, Tailwind CSS, D3.js, React Router
- **Backend:** Express 5, Prisma, Zod, JWT, Multer
- **NLU:** FastAPI, psycopg2, dateparser, rapidfuzz, spaCy

---

## Project Structure

```
compliance-bot/
├── src/                    # Node.js backend
│   ├── app.ts             # Express setup, serves React build
│   ├── server.ts          # Entry point
│   ├── config/            # env.ts, db.ts
│   ├── middleware/        # auth, error, upload
│   ├── lib/parsers/       # Excel, CSV parsers
│   ├── modules/           # auth, uploads, complianceRecords, chatbot
│   └── utils/             # response helper, logger
├── client/                 # React frontend
│   ├── src/
│   │   ├── main.tsx       # Entry
│   │   ├── App.tsx        # Router + providers
│   │   ├── pages/         # Upload, Data, Chat, Dashboard
│   │   ├── components/    # Layout, Navbar, StatusBadge, EditModal
│   │   ├── hooks/         # TanStack Query hooks
│   │   ├── lib/           # API client, Zustand store
│   │   └── types/         # TypeScript interfaces
│   ├── index.html
│   ├── vite.config.ts
│   └── tailwind.config.js
├── nlu-service/            # Python NLU service
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── db.py
│   │   ├── schemas.py
│   │   └── nlu/           # intents, entities, templates, pipeline
│   └── requirements.txt
├── setup.bat
├── start.bat
└── .gitignore
```
