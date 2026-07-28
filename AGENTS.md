Project Overview
Purpose: Compliance Manager is a full-stack web application for managing fuel station environmental compliance records. It enables users to upload inspection data, track test statuses (PASS/FAIL), monitor certificate expirations, and query compliance data through natural language interfaces.

Business Goals:

Centralize compliance test data from spreadsheets (Excel, CSV, Access)

Provide real-time visibility into test failure rates and expirations

Enable natural language querying for non-technical users

Reduce manual compliance tracking overhead

Technology Stack
Frontend
Category	Technology	Purpose
Framework	React 19	UI rendering
Routing	React Router v7	Client-side navigation
State	Zustand	Global state (auth)
Data Fetching	TanStack React Query	Server state & caching
Charts	Chart.js + D3	Data visualization
Forms	React Hook Form (implicit)	Form handling via native
Styling	Tailwind CSS	Utility-first styling
Build	Vite	Development & bundling
Types	TypeScript	Type safety
Backend (Node.js)
Category	Technology	Purpose
Runtime	Node.js	Server environment
Framework	Express	HTTP server & routing
ORM	Prisma	Database access (PostgreSQL)
File Parsing	Multer	File upload handling
Validation	Zod	Schema validation
Auth	JWT (implied)	Authentication
Python NLP Service
Category	Technology	Purpose
Framework	FastAPI	API for NLU queries
NLP	spaCy	Entity extraction
Fuzzy Matching	rapidfuzz	City name matching
Date Parsing	dateparser	Natural date interpretation
Database	psycopg2	PostgreSQL connection
Schema	Pydantic	Request/response validation
Database
Category	Technology
Primary	PostgreSQL
Driver	Prisma adapter + psycopg2
System Architecture
text
┌─────────────────────────────────────────────────────────────────────┐
│                           Client (React)                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │  Upload  │  │   Data   │  │   Chat   │  │    Dashboard       │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTP API
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Backend API (Express + Prisma)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │  Auth        │  │  Upload      │  │  Records                 │ │
│  │  (JWT)       │  │  (Multer)    │  │  (CRUD)                  │ │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                              │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │  ComplianceRecord (flat table with 22 test columns)           ││
│  │  UploadedFile (file metadata + checksum dedup)               ││
│  │  User (auth)                                                 ││
│  └────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Python service integration
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                Python NLU Service (FastAPI)                         │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │  Intent Classification → SQL Generation → Chart Building     ││
│  │  • Failure rates       • Status counts     • Expirations     ││
│  │  • Trends over time    • Comparisons       • Record listing  ││
│  └────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
Data Ingestion Flow
text
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. Upload (Excel/CSV/Access)                                            │
│    ┌───────────────────────────────────────────────────────────────────┐│
│    │  Multer → Disk storage → Checksum validation → Duplicate check ││
│    └───────────────────────────────────────────────────────────────────┘│
│                                    │                                    │
│                                    ▼                                    │
│ 2. Parsing (Excel/CSV/ACCESS)                                           │
│    ┌───────────────────────────────────────────────────────────────────┐│
│    │  Extract rows → Normalize column names → Parse values            ││
│    │  • Excel serial dates → Date objects                            ││
│    │  • Status texts (Pass/Fail) → Normalized strings                 ││
│    │  • Column aliasing (raw headers → DB field names)               ││
│    └───────────────────────────────────────────────────────────────────┘│
│                                    │                                    │
│                                    ▼                                    │
│ 3. Validation & Store                                                  │
│    ┌───────────────────────────────────────────────────────────────────┐│
│    │  Validate required fields (store#, city, street)                ││
│    │  Transactional bulk insert → Prisma createMany (implicit)       ││
│    │  Track rows imported vs skipped                                  ││
│    └───────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
Field Mapping (Excel Header → Database Field)
text
"Store#"                    → storeNumber
"CITY"                      → city
"Street Name"               → streetName
"Facility ID#"              → facilityId
"Channel Of Trade"          → channelOfTrade
"Delivery Certificate Expired Date" → deliveryCertificateExpiredDate
"Insurance Expired Date"    → insuranceExpiredDate
"Corrosion Test Status"     → corrosionTestStatus
"Spill Bucket Test Status"  → spillBucketTestStatus
"Overfill Protection Device Test Status" → overfillProtectionDeviceTestStatus
"LLD / Line Tightness Test Status" → lldLineTightnessTestStatus
"ATG / Probes Test Status"  → atgProbesTestStatus
"Sump Test Status"          → sumpTestStatus
"Stage 1 Test Status"       → stage1TestStatus
Reusable Architecture
Shared Utilities (Backend)
Utility	File	Purpose
Response wrapper	utils/response.ts	Standardized {success, data} responses
Error handling	utils/response.ts + error.middleware.ts	AppError class, centralized error handler
Logger	utils/logger.ts	Simple console logger with timestamps
Backend Middleware
Middleware	Purpose
error.middleware.ts	Catches all errors → structured responses
upload.middleware.ts	Multer config (storage, filter, limits)
auth.middleware.ts	JWT verification (implicit via requireAuth)
Frontend Hooks
Hook	Purpose
useRecords	Paginated records with search
useRecord	Single record fetching
useUpdateRecord	Record update mutation
useDeleteRecord	Record delete mutation
UI Component Hierarchy
text
components/
├── ui/
│   ├── Button     (primary|secondary|danger|ghost)
│   ├── Input      (with label support)
│   ├── Card       (border + shadow wrapper)
│   ├── Table      (generic with column definitions)
│   ├── Modal      (overlay + content container)
│   └── StatsCard  (label + value display)
├── Layout.tsx     (Navbar + Outlet)
├── Navbar.tsx     (navigation + auth state)
├── StatusBadge    (PASS/FAIL styling)
├── ChartRenderer  (Chart.js wrapper)
└── EditModal      (full record editing)
Validation Pattern
Zod schemas for request validation

parseDate function for flexible date parsing (Excel serials, ISO strings)

parseStatus function for status normalization

API Response Pattern
typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: { code: string, message: string } }
Database Schema
Core Tables
prisma
model ComplianceRecord {
  id                                    String   @id
  storeNumber                           Int
  city                                  String
  streetName                            String
  facilityId                            Int?
  channelOfTrade                        String?
  deliveryCertificateExpiredDate        DateTime?
  insuranceExpiredDate                  DateTime?
  corrosionTestDate                     DateTime?
  corrosionTestStatus                   String?   // PASS | FAIL | custom
  spillBucketsTestDate                  DateTime?
  spillBucketTestStatus                 String?
  // ... 7 more test pairs (date + status)
  uploadedFileId                        String?
  uploadedFile                          UploadedFile? @relation
  createdAt                             DateTime
  updatedAt                             DateTime
}
Index Strategy
@@index([storeNumber]) - Store number lookups

@@index([city]) - City filtering

@@index([corrosionTestStatus]) - Status aggregation

@@index([spillBucketTestStatus]) - Status aggregation

Philosophy
Flat table design (22 test columns) - Denormalized for query simplicity

Test columns follow pattern: {testName}TestDate + {testName}TestStatus

Soft deletes: None (hard delete only)

Upload tracking: UploadedFile table stores file metadata + checksum for dedup

CRUD Boundaries
Operation	Endpoint	Auth Required
List records	GET /api/records	No
Get single	GET /api/records/:id	No
Update record	PATCH /api/records/:id	Yes
Delete record	DELETE /api/records/:id	Yes
Upload file	POST /api/uploads	No
List uploads	GET /api/uploads	No
Authentication & Authorization
Approach
JWT-based authentication (implied)

Registration: POST /api/auth/register (email + password)

Login: POST /api/auth/login (returns token)

Protected routes use requireAuth middleware

Role-based: UserRole { ADMIN, USER }

Security Notes
Passwords hashed (by auth service)

All update/delete operations require auth

Read operations are public (no auth required)

Natural Language Processing (NLU Service)
Architecture
text
User Question
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│ Intent Classification (intents.py)                             │
│   ├── FAILURE_RATE         → "failure rate for Corrosion"     │
│   ├── STATUS_COUNTS        → "how many PASS for Spill?"       │
│   ├── CHART_DATA           → "pie chart of test results"      │
│   ├── LIST_RECORDS         → "show records for store #38"     │
│   ├── EXPIRING_SOON        → "what expires in 30 days?"       │
│   ├── OVERDUE              → "what's overdue?"                │
│   └── UNRECOGNIZED         → fallback with examples           │
│                                                                 │
│ Entity Extraction (entities.py)                                 │
│   ├── Date ranges: "from Jan to Mar"                           │
│   ├── Months: "in June"                                       │
│   ├── Cities: fuzzy match against known cities                │
│   ├── Test types: "Corrosion", "Spill Buckets", etc.          │
│   └── Store numbers: "#38"                                    │
│                                                                 │
│ SQL Generation (templates.py)                                  │
│   └── Parameterized queries (no SQL injection)                │
│                                                                 │
│ Chart Building (pipeline.py)                                   │
│   ├── Pie / Doughnut / PolarArea                              │
│   ├── Bar / Histogram                                         │
│   ├── Line (trends over time)                                 │
│   ├── Scatter (compare two tests)                             │
│   └── Radar                                                   │
└─────────────────────────────────────────────────────────────────┘
Intent Classification Rules
Intent	Detection Patterns
FAILURE_RATE	"failure rate", "fail.%", "failure.rate"
STATUS_COUNTS	"pass.count", "how many.pass", "count.*status"
CHART_DATA	"chart", "graph", "plot", "visualize"
LIST_RECORDS	"list", "show", "all.*records"
EXPIRING_SOON	"expiring", "expire soon", "ending soon"
OVERDUE	"overdue", "past due", "expired"
Chart Type Detection
User Says	Chart Type
"pie chart"	pie
"doughnut"/"donut"	doughnut
"bar"/"column"	bar
"line"/"trend"	line
"scatter"	scatter
"radar"	radar
"polar"	polarArea
Development Workflow
Coding Conventions
TypeScript:

Use explicit return types for functions

Use Record<string, unknown> for dynamic objects

Prefer as const for literal types

Use interface for objects, type for unions/utilities

React:

Functional components with hooks

Custom hooks for data fetching (React Query)

Composition over configuration (UI components)

Prisma:

Use @prisma/client for type safety

Transactional operations for bulk inserts

Index columns used in WHERE/ORDER BY clauses

Python:

Type hints for all functions

Pydantic models for request/response

Use %s placeholders for SQL parameters (psycopg2)

No string interpolation into SQL

Project Principles
Search → Reuse → Extend → Create

First search for existing solutions

Reuse components, utilities, patterns

Extend when custom behavior needed

Only create when nothing exists

API Contract First

Backend defines schemas (Zod)

Frontend consumes with type safety

Error codes are standardized

Stateless by Default

React Query manages server state

Zustand only for global client state (auth)

No server-side session storage

Single Source of Truth

Database is primary data store

No duplicate data in Redis/cache

File storage for uploads only

Anti-Patterns to Avoid
Anti-Pattern	Why	Correct Approach
SQL string concatenation	SQL injection risk	Use parameterized queries
Large component files	Reduced maintainability	Split into hooks + components
Direct DB access in controllers	Tight coupling	Use service layer
Non-transactional bulk writes	Partial failures	Wrap in Prisma transaction
Hardcoded styles	Theming issues	Use Tailwind classes
any in TypeScript	Type safety loss	Use unknown or proper types
Duplicate API calls	Performance issues	Use React Query caching
Inline error messages	Inconsistent UX	Use error code constants
Rules to Follow
Always validate inputs (Zod for backend, type checking for frontend)

Wrap database operations in transactions when multiple writes occur

Use parameterized SQL in NLU service

Handle all errors with AppError + error middleware

Invalidate React Query cache after mutations

Use requireAuth for all non-read operations

Log all errors with appropriate context

Use excelSerialToDate for Excel date parsing

Normalize statuses to "PASS"/"FAIL" (or keep as-is for unknown)

Include checksum deduplication for uploaded files

Compact Architectural Overview
text
Compliance Manager: React + Express + PostgreSQL + Python NLU

┌──────────────┐     HTTP API      ┌──────────────┐     SQL      ┌──────────────┐
│   Frontend   │ ◄──────────────► │   Backend    │ ◄──────────► │   Database   │
│   React 19   │                  │   Express    │              │  PostgreSQL  │
│   TanStack   │                  │   Prisma     │              │  Compliance  │
│   Tailwind   │                  │   Zod        │              │  Records     │
│   Chart.js   │                  │   Multer     │              │  (22 cols)   │
│   D3         │                  │   JWT        │              │              │
└──────────────┘                  └──────────────┘              └──────────────┘
         │                                     │                          │
         │                     ┌───────────────┘                          │
         │                     │                                          │
         │                     ▼                                          │
         │          ┌────────────────────┐                               │
         └─────────►│   Python NLU API   │───────────────────────────────┘
                    │   FastAPI          │
                    │   spaCy + rapidfuzz │
                    │   SQL templates     │
                    │   Chart builders    │
                    └────────────────────┘
Development Setup
bash
# Backend
npm install
npx prisma generate
npx prisma db push
npm run dev

# Frontend
cd client
npm install
npm run dev

# NLU Service
cd nlu-service
pip install -r requirements.txt
python -m app.main
Environment Variables
text
DATABASE_URL=postgresql://compliance:compliance@localhost:5432/compliance_db
PORT=4000
JWT_SECRET=your-secret
UPLOAD_DIR=./uploads
GEMINI_API_KEY=optional
File Structure Reference
text
client/
├── src/
│   ├── components/       # Reusable UI
│   │   ├── ui/           # Base components
│   │   ├── ChartRenderer.tsx
│   │   ├── EditModal.tsx
│   │   └── StatusBadge.tsx
│   ├── hooks/            # React Query hooks
│   ├── pages/            # Route pages
│   ├── types/            # TypeScript types
│   └── lib/              # API client + store

src/backend/              # Express API
├── modules/
│   ├── auth/             # Authentication
│   ├── chatbot/          # NLU + Gemini proxy
│   ├── complianceRecords/# CRUD operations
│   └── uploads/          # File uploads
├── middleware/           # Error, upload, auth
└── utils/                # Logger, response

nlu-service/              # Python NLU
├── app/
│   ├── nlu/              # Intent + entity extraction
│   ├── config.py         # DB connection
│   ├── db.py             # DB queries
│   ├── schemas.py        # Pydantic models
│   └── main.py           # FastAPI app