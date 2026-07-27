import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import PORT
from .schemas import QueryRequest, QueryResponse
from .nlu.pipeline import handle

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("nlu")

app = FastAPI(title="Compliance NLU Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)


@app.post("/nlu/query", response_model=QueryResponse)
def query(req: QueryRequest):
    logger.info("Received query: %.120s", req.question)
    result = handle(req.question)
    logger.info("Intent: %s, rows: %d, chart: %s",
                result.intent, len(result.rows),
                result.chart.type if result.chart else "none")
    return result


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=PORT, reload=True)
