import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import PORT, CACHE_TTL
from .schemas import QueryRequest, QueryResponse
from .nlu.pipeline import handle
from .nlu.cache import get as cache_get, set as cache_set, invalidate_all

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("nlu")

app = FastAPI(title="Compliance NLU Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4000",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:4000",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.post("/nlu/query", response_model=QueryResponse)
def query(req: QueryRequest):
    logger.info("Received query: %.120s", req.question)

    # Check cache first
    cached = cache_get(req.question)
    if cached:
        logger.info("Cache HIT for query: %.120s", req.question)
        return QueryResponse(**cached)

    result = handle(req.question)
    logger.info(
        "Intent: %s, rows: %d, chart: %s",
        result.intent,
        len(result.rows),
        result.chart.type if result.chart else "none",
    )

    # Cache successful non-error results
    if result.intent != "error":
        cache_set(req.question, result.model_dump(), ttl=CACHE_TTL)

    return result


@app.post("/nlu/cache/invalidate")
def invalidate():
    cleared = invalidate_all()
    logger.info("Invalidated NLU query cache: %d keys deleted", cleared)
    return {"status": "ok", "cleared": cleared}


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=PORT, reload=True)
