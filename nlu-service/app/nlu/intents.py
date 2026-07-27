"""
Flexible intent classification for compliance queries.

Supports a wide range of natural language patterns including:
- Chart type specification ("pie chart of failure rates")
- Comparisons ("compare pass vs fail")
- Ratios ("fail to pass ratio")
- Trends over time ("trend of corrosion tests")
- Scatter/comparison plots ("plot corrosion vs spill buckets")
"""

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

CHART_TYPES = {
    "pie": "pie",
    "doughnut": "doughnut",
    "donut": "doughnut",
    "bar": "bar",
    "column": "bar",
    "line": "line",
    "line graph": "line",
    "line chart": "line",
    "trend": "line",
    "scatter": "scatter",
    "scatter plot": "scatter",
    "scatterplot": "scatter",
    "radar": "radar",
    "polar": "polarArea",
    "polar area": "polarArea",
    "histogram": "bar",  # histograms are bar charts with numeric bins
    "area": "line",      # filled line area
}


def classify(question: str) -> str:
    """Classify the user question into an intent category."""
    q = question.lower().strip()

    # --- RATIO / COMPARISON: "fail:pass ratio", "fail to pass ratio", "compare X vs Y" ---
    if re.search(r"(ratio|compare|comparison|vs\.?|versus)", q):
        return "CHART_DATA"

    # --- FAILURE RATE ---
    if re.search(r"failure rate|fail.*?%|rate|percentage.*fail|fail.*rate", q):
        return "FAILURE_RATE"

    # --- TREND / OVER TIME ---
    if re.search(r"(trend|over time|timeline|time series|monthly|weekly|daily|by month|by week|over the)", q):
        return "CHART_DATA"

    # --- CHART / VISUALIZATION ---
    if re.search(r"(chart|graph|plot|visualize|draw|show.*chart|render|paint|display)", q):
        return "CHART_DATA"

    # --- STATUS COUNTS ---
    if re.search(r"(pass|fail|pending).*(count|how many|number|\?|total)", q) or \
       re.search(r"(how many|count|number of).*(pass|fail|pending)", q) or \
       re.search(r"count.*(pass|fail|pending)", q):
        return "STATUS_COUNTS"

    # --- LIST / SHOW RECORDS ---
    if re.search(r"list.*(record|data|entry|store|location)", q) or \
       re.search(r"show.*(record|data|entry|store|location)", q) or \
       re.search(r"all.*(record|store|location|cities)", q) or \
       re.search(r"get.*(record|data|entry)", q) or \
       re.search(r"display.*(record|data|entry)", q):
        return "LIST_RECORDS"

    # --- EXPIRING SOON ---
    if re.search(r"expir(ing|es|ation|ed|y)|about to expire|expire soon|ending soon", q):
        return "EXPIRING_SOON"

    # --- OVERDUE / PAST DUE ---
    if re.search(r"overdue|past due|expired|lapsed|lapse", q):
        return "OVERDUE"

    return "UNRECOGNIZED"


def extract_chart_type(question: str) -> str:
    """Extract the desired chart type from the user's question.

    Checks if the user specified a chart type like 'pie chart' or 'line graph'.
    Returns the chart type string (e.g. 'pie', 'bar', 'line') or 'bar' as default.
    """
    q = question.lower()
    # Check for explicit chart type mentions in order of specificity
    matches = []
    for keyword, chart_type in CHART_TYPES.items():
        if keyword in q:
            matches.append((len(keyword), chart_type))

    if matches:
        # Return the most specific match (longest keyword)
        matches.sort(key=lambda x: -x[0])
        return matches[0][1]

    return "bar"  # default


def extract_test_type(question: str) -> str | None:
    """Extract the test type mentioned in the question."""
    q = question.lower()
    # Check against known test types
    for t in TEST_TYPES:
        if t.lower() in q:
            return t
    return None


def extract_two_test_types(question: str) -> tuple[str | None, str | None]:
    """Extract two test types for comparison queries like 'X vs Y'."""
    q = question.lower()
    found = []
    # Sort by length (longest first) to match compound names first
    sorted_types = sorted(TEST_TYPES, key=len, reverse=True)
    for t in sorted_types:
        tl = t.lower()
        if tl in q and t not in found:
            found.append(t)
            if len(found) == 2:
                return (found[0], found[1])
    return (found[0] if found else None, None)


def extract_status(question: str) -> str | None:
    """Extract the status filter mentioned in the question."""
    q = question.lower()
    for s in STATUS_VALUES:
        if s.lower() in q:
            return s
    return None


def extract_store_number(question: str) -> int | None:
    """Extract a store number from the question."""
    q = question.lower()
    # Primary: "store #38" or "store 38"
    m = re.search(r"store\s*#?\s*(\d+)", q)
    if m:
        return int(m.group(1))
    # Secondary: just a standalone number that looks like a store/ID (2+ digits)
    m = re.search(r"#?\s*(\d{2,})", question)
    if m:
        return int(m.group(1))
    return None


def is_ratio_query(question: str) -> bool:
    """Check if the user is asking for a ratio of two things."""
    q = question.lower()
    return bool(re.search(r"(ratio|proportion|percent|percentage|split|breakdown)", q))


def is_query_for(question: str, keyword: str) -> bool:
    """Generic helper: return True if keyword appears in question."""
    return keyword.lower() in question.lower()
