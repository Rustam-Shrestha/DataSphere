# Compliance Manager

A compliance record management system for tracking fuel station inspections and test results. Upload Excel/CSV exports, browse records, and query data via natural language — powered by a custom NLU engine or Gemini AI.

## Architecture

Two services run side-by-side:

| Process | Port | Tech | Purpose |
|---------|------|------|---------|
| **Node Backend** | `4000` | Express 5 + Prisma + PostgreSQL | REST API, file upload, auth, serves frontend, Gemini proxy |
| **NLU Service** | `8000` | FastAPI + spaCy + psycopg2 | Rule-based natural language → SQL conversion |

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- PostgreSQL running on `localhost:5432`

### One-step setup

```
setup.bat
```

This will:
1. Install Node dependencies (`npm install`)
2. Generate Prisma client
3. Create Python virtual environment (`.venv`)
4. Install Python packages
5. Download spaCy language model
6. Push database schema to PostgreSQL
7. Create `.env` files from defaults

### Manual setup

```bash
# Install Node dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Python virtual environment
python -m venv nlu-service\.venv
nlu-service\.venv\Scripts\pip install -r nlu-service\requirements.txt
nlu-service\.venv\Scripts\python -m spacy download en_core_web_sm

# Edit environment files
# .env          — main app config
# nlu-service\.env — NLU service config
```

### Start the services

```
start.bat
```

Or start each manually:

```bash
# Terminal 1 — Node backend
npx tsx src/server.ts

# Terminal 2 — NLU service
cd nlu-service
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

Then open **http://localhost:4000**

## Pages

| Page | Route | Description |
|------|-------|-------------|
| **Upload** | `/` | Login/Register, upload Excel/CSV files, view recent uploads |
| **Data** | `/data.html` | Searchable, paginated table of all records with inline edit/delete |
| **Chat** | `/chatbot.html` | Ask questions in natural language with two modes |
| **Dashboard** | `/dashboard.html` | D3 charts, stats, expiry overview |

## Chat Modes

### NLU Engine (default)
Rule-based intent classification + entity extraction → fixed SQL templates. Runs locally via the Python FastAPI service.

- Failure rates by test type
- Pass/fail counts
- List records by store or city
- Expiring/overdue certificates
- Chart data aggregation

### Gemini AI
Requires `GEMINI_API_KEY` in `.env`. Uses Google's Gemini 2.0 Flash model to answer compliance questions. The key provided in the project is pre-configured.

Switch modes using the toggle buttons in the chat interface.

## Database Schema

### ComplianceRecord (flat table)

| Column | Type | Source |
|--------|------|--------|
| storeNumber | Int | Store# |
| city | String | CITY |
| streetName | String | Street Name |
| facilityId | Int? | Facility ID# |
| channelOfTrade | String? | Channel Of Trade |
| deliveryCertificateExpiredDate | DateTime? | Delivery Certificate Expired Date |
| insuranceExpiredDate | DateTime? | Insurance Expired Date |
| corrosionTestDate / Status | DateTime? / String? | Corrosion Test Date / Status |
| spillBucketsTestDate / Status | DateTime? / String? | Spill Buckets Test Date / Status |
| overfillProtectionDeviceTestDate / Status | DateTime? / String? | Overfill Protection Device Test Date / Status |
| lldLineTightnessTestDate / Status | DateTime? / String? | LLD / Line Tightness Test Date / Status |
| atgProbesTestDate / Status | DateTime? / String? | ATG / Probes Test Date / Status |
| sumpTestDate / Status | DateTime? / String? | Sump Test Date / Status |
| stage1TestDate / Status | DateTime? / String? | Stage 1 Test Date / Status |

### UploadedFile
Tracks imported files with SHA256 checksum for deduplication.

### User
Basic authentication (register/login) with JWT tokens.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, get JWT token |
| POST | `/api/uploads` | Yes | Upload Excel/CSV file |
| GET | `/api/uploads` | No | List recent uploads |
| GET | `/api/records` | No | List records (query: page, pageSize, search) |
| GET | `/api/records/:id` | No | Get single record |
| PATCH | `/api/records/:id` | Yes | Update record |
| DELETE | `/api/records/:id` | Yes | Delete record |
| POST | `/api/chatbot/query` | No | Chat query (body: { question, mode }) |

## Environment Variables

### `.env` (project root)
```
DATABASE_URL=postgresql://user:pass@localhost:5432/compliance_db
JWT_SECRET=change_me_before_deploy
PORT=4000
UPLOAD_DIR=./uploads
NLU_SERVICE_URL=http://localhost:8000
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=development
```

### `nlu-service/.env`
```
DATABASE_URL=postgresql://user:pass@localhost:5432/compliance_db
PORT=8000
```

## Import Format

The system expects Excel (.xlsx, .xls) or CSV files with these columns:

```
Store#, CITY, Street Name, Facility ID#, Channel Of Trade,
Delivery Certificate Expired Date, Insurance Expired Date,
Corrosion Test Date, Corrosion Test Status,
Spill Buckets Test Date, Spill Bucket Test Status,
Overfill Protection Device Test Date, Overfill Protection Device Test Status,
LLD / Line Tightness Test Date, LLD / Line Tightness Test Status,
ATG / Probes Test Date, ATG / Probes Test Status,
SumpTest Date, Sump Test Status,
Stage 1 Test Date, Stage 1 Test Status
```

Columns not found are left as null. Rows missing Store#, CITY, and Street Name are skipped.

## Project Structure

```
compliance-bot/
├── src/                      # Node.js backend
│   ├── app.ts               # Express app setup
│   ├── server.ts            # Entry point
│   ├── config/              # env.ts, db.ts
│   ├── middleware/           # auth, error, upload
│   ├── lib/parsers/         # Excel, CSV parsers
│   ├── modules/
│   │   ├── auth/            # Register/login
│   │   ├── uploads/         # File import
│   │   ├── complianceRecords/ # CRUD
│   │   └── chatbot/         # NLU + Gemini proxy
│   └── utils/               # response helper, logger
├── nlu-service/              # Python NLU service
│   ├── app/
│   │   ├── main.py          # FastAPI app
│   │   ├── config.py        # Environment
│   │   ├── db.py            # Database helpers
│   │   ├── schemas.py       # Pydantic models
│   │   └── nlu/
│   │       ├── intents.py   # Intent classification
│   │       ├── entities.py  # Entity extraction
│   │       ├── templates.py # SQL templates
│   │       └── pipeline.py  # Query pipeline
│   └── requirements.txt
├── public/                   # Static frontend
│   ├── index.html           # Upload page
│   ├── data.html            # CRUD page
│   ├── chatbot.html         # Chat page
│   ├── dashboard.html       # Dashboard page
│   ├── css/style.css
│   └── js/
├── prisma/schema.prisma     # Database schema
├── uploads/                  # Uploaded files (gitignored)
├── setup.bat                 # One-click setup
├── start.bat                 # Launch both services
└── .gitignore
```
