# FinChat — Build Guide for AI Agents

## Project Overview

A **document Q&A chatbot** — users upload PDFs, CSVs, Excel files, or SQLite databases, then ask natural-language questions. Backend is async Python (FastAPI), frontend is a single-file vanilla HTML/JS SPA, state lives in Redis.

### Key Capabilities

- Multi-provider LLM (Gemini / OpenAI), swappable at runtime via header; model selected by user from dynamic list fetched from backend (`GET /api/v1/models`)
- Streaming token-by-token answers via SSE
- Two-path PDF handling: small (≤3 MB) → native provider file upload; large → PyPDF2 text extraction + inline content or RAG
- RAG pipeline (chunk → embed → store in Redis → cosine similarity retrieval)
- Direct SQL query panel for SQLite files
- Rate limiting + daily quotas (Redis fixed-window)
- Answer caching (SHA256 key, 1hr TTL)
- External DB connections (PostgreSQL, MySQL, MSSQL) with encrypted credentials
- JWT auth (HS256, 24hr expiry)
- Background sweep task for uploaded file cleanup

---

## Technology Stack

| Layer | Choice | Reason |
|---|---|---|
| Language | Python 3.11+ | `async`/`await`, PEP 604 types |
| Backend | FastAPI + Uvicorn | Async REST + SSE streaming |
| LLM — Gemini | `google-genai` SDK | Sync SDK bridged via `asyncio.to_thread` |
| LLM — OpenAI | `openai` SDK | Native async (`AsyncOpenAI`) |
| State store | Redis (`redis.asyncio`) | Sessions, caches, RAG vectors, rate limits |
| File parsing | PyPDF2, pandas, openpyxl | PDF/CSV/XLSX text extraction |
| RAG | Custom (numpy + Redis) | Chunk → embed (Gemini/OpenAI) → cosine sim |
| Auth | PyJWT (HS256) | Stateless bearer tokens |
| Config | Pydantic Settings | `.env`-driven, type-safe |
| Testing | pytest + pytest-asyncio + httpx + fakeredis | ASGI-level integration tests |

---

## Architecture Rules

### Directory Layout (new project)

```
project/
├── app/
│   ├── main.py              # create_app() factory, lifespan, middleware, error handlers
│   ├── config.py            # pydantic-settings Settings class
│   ├── auth.py              # JWT issue + verify
│   ├── dependencies.py      # FastAPI Depends() wiring (redis, session, provider)
│   ├── errors.py            # Custom exception hierarchy
│   ├── limits.py            # Rate limit + quota
│   ├── api/                 # Route handlers (one file per resource)
│   │   ├── auth.py          # POST /auth/token
│   │   ├── models.py        # GET /api/v1/models
│   │   ├── sessions.py      # Session CRUD
│   │   ├── files.py         # Upload
│   │   ├── messages.py      # Chat streaming
│   │   └── sql.py           # SQL execute
│   ├── models/
│   │   └── session.py       # Pydantic models
│   └── services/
│       ├── session.py       # Redis-backed session store
│       ├── cache.py         # Answer caching
│       ├── sweep.py         # Background cleanup
│       ├── llm/
│       │   ├── base.py      # LLMProvider Protocol
│       │   ├── gemini.py    # Gemini impl
│       │   ├── openai.py    # OpenAI impl
│       │   └── prompts.py   # System prompt construction
│       ├── parsing/
│       │   ├── csv.py       # CSV → text
│       │   ├── pdf.py       # PDF → text (PyPDF2)
│       │   ├── xlsx.py      # Excel → text
│       │   └── sqlite_db.py # SQLite introspection + query
│       └── rag/
│           ├── chunker.py   # Text splitting
│           ├── embeddings.py# Embedding + cosine similarity
│           └── store.py     # Redis vector store
├── tests/
├── frontend.html            # Single-file SPA
├── requirements.txt
├── .env.example
└── AGENTS.md
```

### App Factory Pattern

`app/main.py` exports `create_app()` returning a FastAPI instance:

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup: create redis pool, start background tasks
    yield
    # shutdown: cancel tasks, close pools

def create_app() -> FastAPI:
    app = FastAPI(lifespan=lifespan)
    app.add_middleware(...)
    app.add_exception_handler(...)
    app.include_router(...)
    return app

app = create_app()  # module-level for uvicorn
```

### Router Convention

```python
router = APIRouter(prefix="/api/v1/sessions", tags=["sessions"])

@router.post("", status_code=201)
async def create(
    store: SessionStore = Depends(get_session_store),
    user_id: str = Depends(get_current_user),
) -> CreateSessionResponse:
    ...
```

### Exception Handling

Define exceptions in `app/errors.py`. Register handlers in `create_app()`:

```python
@app.exception_handler(SessionNotFoundError)
async def _(request, exc):
    return JSONResponse(status_code=404, content={"detail": str(exc)})
```

### LLM Provider Protocol

```python
class LLMProvider(Protocol):
    async def upload_file(self, data: bytes, filename: str, mime: str) -> str: ...
    async def delete_file(self, ref: str) -> None: ...
    async def ask_stream(self, question: str, file_refs: list[str], history: list[dict], system: str) -> AsyncIterator[str]: ...
```

- Gemini: sync SDK via `asyncio.to_thread`, streaming via thread-pool producer + `asyncio.Queue` consumer
- OpenAI: native async SDK, Responses API

### Redis Key Conventions

| Prefix | Pattern | TTL |
|---|---|---|
| `session:{id}` | JSON blob | `session_ttl` (24h) |
| `session:{id}:content:{fid}` | Raw text | same |
| `cache:answer:{sha256}` | Cached answer | 1h |
| `rag:{sid}:{fid}:chunks` | JSON array | same as session |
| `rag:{sid}:{fid}:vectors` | Binary (float32) | same |
| `ratelimit:{uid}:{bucket}` | Counter | window (60s) |
| `quota:{uid}:{YYYY-MM-DD}` | Counter | until midnight |

---

## Code Style

- **Imports**: stdlib → third-party → local, grouped with blank lines
- **Types**: `from __future__ import annotations`, PEP 604 (`str | None`), `list[str]`
- **Logging**: `logger = logging.getLogger(__name__)`, structured `extra={}`
- **Naming**: `snake_case` functions/vars, `CamelCase` classes, `UPPER_SNAKE` constants
- **Docstrings**: triple-quoted module docstrings explaining design decisions
- **Comments**: Write rationale for non-obvious choices, ⚠️ for warnings, security notes where needed
- **No copyright headers or author tags**
- **Async-first**: `async/await` throughout; bridge sync SDKs with `asyncio.to_thread`

### File Parsing Patterns

- Each parser in `app/services/parsing/` exports a single public function
- Returns a dataclass/Pydantic model with `.inline_content` (str) and `.metadata_block` (str)
- CSV: pandas with small/large threshold (send inline vs RAG)
- XLSX: openpyxl + pandas, detect formulas
- PDF: PyPDF2 `PdfReader`, page-delimited text (`--- Page N ---`)
- SQLite: `?mode=ro&immutable=1`, `validate_select_only()` security gate, `threading.Timer` for timeout

### RAG Pipeline

```
chunk_text(content) → list[Chunk]
embed_texts(chunks, provider, api_key) → list[np.ndarray]
store chunks JSON + vectors binary in Redis
---
query → embed_query(query) → cosine_similarity → top_k chunks
```

- Chunk size: 800 chars, overlap: 100 chars (config-driven)
- Embedding: Gemini `gemini-embedding-2` (768d), OpenAI `text-embedding-3-small` (1536d)
- Top-k: 8 (config-driven), uses `np.argpartition`

### SSE Streaming

```python
async def _generate():
    try:
        async for chunk in provider.ask_stream(...):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"
    except Exception:
        yield "event: error\ndata: message\n\n"

return StreamingResponse(_generate(), media_type="text/event-stream")
```

### Caching

Cache key = `cache:answer:{sha256(user_id + sorted(file_ids) + normalised_question)}`

Normalisation: lowercase, collapse whitespace, strip punctuation.

On cache HIT, stream cached answer with `X-Cache: HIT` header.

---

## Testing

### Commands

```bash
pytest tests/ -v --asyncio-mode=auto
ruff check app/
mypy app/
```

### Test Patterns

```python
@pytest.mark.asyncio
async def test_something():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        r = await c.post("/endpoint", json={...}, headers=auth_headers())
    assert r.status_code == 200
```

- Use `fakeredis` as Redis mock
- Override dependencies with `app.dependency_overrides[...] = lambda: mock`
- `MINIMAL_PDF` constant for PDF upload tests (valid magic bytes)

---

## Security Rules

- **Never log tokens, API keys, or passwords**
- All SQL input validated: `validate_select_only()` rejects non-SELECT, multi-statement, DDL
- Read-only SQLite connections via `?mode=ro&immutable=1`
- JWT: 24hr expiry, `sub` claim required, invalid/expired → 401
- API keys: passed via `X-Provider-Key` header, never in URL or body
- DB credentials: encrypted with `cryptography.fernet` at rest in Redis

---

## Build & Run

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # fill in secrets
uvicorn app.main:app --reload --port 8000
```

Requires Redis at `localhost:6379`.

---

## Key Design Decisions

1. **PDF two-path strategy**: Small PDFs get native provider upload (preserves layout/images). Large PDFs are text-extracted to avoid token-limit errors. When building, ensure `_build_user_content()` properly includes text-extracted PDF content (not just natively uploaded ones).
2. **No Assistants API**: OpenAI's Assistants API avoided due to complex thread/run lifecycle — use Responses API instead.
3. **RAG only for large content**: Inline content below 200K chars is sent as-is to the LLM; only larger content triggers chunking + retrieval. This avoids unnecessary complexity for small files.
4. **Sync SDKs bridged**: Blocking SDKs (gemini client) run in thread pools via `asyncio.to_thread` — never block the event loop.
5. **Structured logging everywhere**: Every important action logs with `extra={}` for observability.
6. **No ORM**: Data models are Pydantic, storage is Redis — no SQL database for app state.
