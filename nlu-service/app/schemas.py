from pydantic import BaseModel
from typing import Optional


class QueryRequest(BaseModel):
    question: str


class Chart(BaseModel):
    type: str
    labels: list[str]
    values: list[int]


class QueryResponse(BaseModel):
    intent: str
    answer: str
    sql: str
    rows: list[dict]
    chart: Optional[Chart] = None
