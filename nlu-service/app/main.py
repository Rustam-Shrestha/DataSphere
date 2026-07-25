from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import PORT
from .schemas import QueryRequest, QueryResponse
from .nlu.pipeline import handle

app = FastAPI(title="Compliance NLU Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)


@app.post("/nlu/query", response_model=QueryResponse)
def query(req: QueryRequest):
    return handle(req.question)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=PORT, reload=True)
