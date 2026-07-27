from pydantic import BaseModel
from typing import Optional


class QueryRequest(BaseModel):
    question: str


class Dataset(BaseModel):
    label: str
    data: list
    backgroundColor: Optional[list[str] | str] = None
    borderColor: Optional[str] = None
    borderWidth: Optional[int] = None
    pointRadius: Optional[int] = None
    fill: Optional[bool] = None


class Chart(BaseModel):
    type: str
    title: Optional[str] = None
    labels: list[str] = []
    values: list = []
    datasets: Optional[list[Dataset]] = None
    xLabel: Optional[str] = None
    yLabel: Optional[str] = None


class QueryResponse(BaseModel):
    intent: str
    answer: str
    sql: str
    rows: list[dict]
    chart: Optional[Chart] = None
