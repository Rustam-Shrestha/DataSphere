import re

TEST_TYPES = [
    "Corrosion",
    "Spill Buckets",
    "Spill Bucket",
    "Overfill Protection Device",
    "Overfill Protection",
    "LLD",
    "Line Tightness",
    "LLD / Line Tightness",
    "ATG",
    "Probes",
    "ATG / Probes",
    "Sump",
    "Stage 1",
    "Stage",
]

STATUS_VALUES = ["PASS", "FAIL", "PENDING"]


def classify(question: str) -> str:
    q = question.lower().strip()

    if re.search(r"failure rate|fail.*%|rate|percentage.*fail", q):
        return "FAILURE_RATE"

    if re.search(r"(pass|fail|pending).*(count|how many|number)", q) or \
       re.search(r"how many.*(pass|fail|pending)", q) or \
       re.search(r"count.*(pass|fail|pending)", q):
        return "STATUS_COUNTS"

    if re.search(r"list.*(record|data|entry|store)", q) or \
       re.search(r"show.*(record|data|entry|store)", q) or \
       re.search(r"all.*(record|store|location)", q):
        return "LIST_RECORDS"

    if "expir" in q:
        return "EXPIRING_SOON"

    if re.search(r"overdue|past due|expired", q):
        return "OVERDUE"

    if re.search(r"chart|graph|plot|visualize|dashboard", q):
        return "CHART_DATA"

    return "UNRECOGNIZED"


def extract_test_type(question: str) -> str | None:
    q = question.lower()
    for t in TEST_TYPES:
        if t.lower() in q:
            return t
    return None


def extract_status(question: str) -> str | None:
    q = question.lower()
    for s in STATUS_VALUES:
        if s.lower() in q:
            return s
    return None


def extract_store_number(question: str) -> int | None:
    m = re.search(r"store\s*#?\s*(\d+)", question.lower())
    if m:
        return int(m.group(1))
    m = re.search(r"#?\s*(\d{2,})", question)
    if m:
        return int(m.group(1))
    return None
