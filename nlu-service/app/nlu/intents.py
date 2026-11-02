"""
Flexible, multi-signal intent classification and entity extraction for compliance queries.
Supports natural language normalization, abbreviation mapping, fuzzy typo-tolerant matching,
and scoring-based intent classification.
"""

import re
from collections import Counter
from typing import Optional, Tuple

from rapidfuzz import fuzz

TEST_TYPES = [
    "Corrosion",
    "Spill Buckets",
    "Overfill Protection Device",
    "LLD / Line Tightness",
    "ATG / Probes",
    "Sump",
    "Stage 1",
]

# Aliases and abbreviations mapped to canonical test names
ABBREV_MAP = {
    "atg probes": "ATG / Probes",
    "atg probe": "ATG / Probes",
    "atg/probes": "ATG / Probes",
    "atg": "ATG / Probes",
    "probes": "ATG / Probes",
    "probe": "ATG / Probes",
    "lld / line tightness": "LLD / Line Tightness",
    "lld line tightness": "LLD / Line Tightness",
    "lld line": "LLD / Line Tightness",
    "lld/line": "LLD / Line Tightness",
    "line tightness": "LLD / Line Tightness",
    "lld": "LLD / Line Tightness",
    "overfill protection device": "Overfill Protection Device",
    "overfill protection": "Overfill Protection Device",
    "overfill device": "Overfill Protection Device",
    "overfill": "Overfill Protection Device",
    "spill buckets": "Spill Buckets",
    "spill bucket": "Spill Buckets",
    "spill": "Spill Buckets",
    "corrosion": "Corrosion",
    "sump": "Sump",
    "stage 1": "Stage 1",
    "stage1": "Stage 1",
    "stage": "Stage 1",
}

# Common misspellings/typos → normalized form (applied before ABBREV_MAP lookup)
TYPO_MAP = {
    # Corrosion typos
    "corrision": "corrosion",
    "corrosoin": "corrosion",
    "corosion": "corrosion",
    "corossion": "corrosion",
    "corrotion": "corrosion",
    "corrosian": "corrosion",
    "corrosion": "corrosion",
    # Spill Buckets typos
    "spillbucket": "spill bucket",
    "spillbuckets": "spill buckets",
    "spill buckt": "spill buckets",
    "spil bucket": "spill bucket",
    "spill buckets": "spill buckets",
    "spill bukets": "spill buckets",
    "spil": "spill",
    # Overfill typos
    "overfil": "overfill",
    "overfill protecion": "overfill protection",
    "overfill protecton": "overfill protection",
    "overfill protctn": "overfill protection",
    # ATG / Probes typos
    "atg probbe": "atg probes",
    "atg probe": "atg probes",
    "atg probs": "atg probes",
    # LLD typos
    "lld tightness": "lld line tightness",
    "ld line": "lld line",
    "ldd": "lld",
    # Sump typos
    "summp": "sump",
    "samp": "sump",
    # Stage typos
    "stag1": "stage 1",
    "stage1": "stage 1",
    "stge": "stage",
    # Intent synonym expansions — failure-related
    "broken": "fail",
    "not passing": "fail",
    "not working": "fail",
    "how much failure": "failure rate",
    "failing tests": "failure rate",
    "failing rate": "failure rate",
    # Intent synonym expansions — expiring
    "running out": "expiring",
    "about to expire": "expiring soon",
    "about to end": "expiring soon",
    "near expiry": "expiring soon",
    "close to expiring": "expiring soon",
    # Intent synonym expansions — overdue
    "past due": "overdue",
    "already expired": "overdue",
    "lapsed": "overdue",
    # Intent synonym expansions — list/show
    "give me": "show",
    "tell me": "show",
    "fetch": "show",
    "pull up": "show",
    "bring up": "show",
}

# Canonical test names for fuzzy matching fallback
_CANONICAL_TEST_TOKENS = list(ABBREV_MAP.keys())

STATUS_VALUES = ["PASS", "FAIL", "PENDING"]

CHART_TYPES = {
    "pie chart": "pie",
    "pie": "pie",
    "doughnut chart": "doughnut",
    "doughnut": "doughnut",
    "donut chart": "doughnut",
    "donut": "doughnut",
    "bar chart": "bar",
    "bar graph": "bar",
    "bar": "bar",
    "column chart": "bar",
    "column": "bar",
    "line graph": "line",
    "line chart": "line",
    "line": "line",
    "trend line": "line",
    "trend": "line",
    "scatter plot": "scatter",
    "scatter chart": "scatter",
    "scatterplot": "scatter",
    "scatter": "scatter",
    "radar chart": "radar",
    "radar": "radar",
    "polar area": "polarArea",
    "polar chart": "polarArea",
    "polar": "polarArea",
    "histogram": "bar",
    "histo": "bar",
    "area chart": "line",
    "area": "line",
}


def normalize(question: str) -> str:
    """Normalize text: strip, lowercase, collapse spaces, apply typo corrections."""
    q = question.lower().strip()
    q = re.sub(r"\s+", " ", q)
    # Apply typo / synonym map (longest-match first)
    for wrong, right in sorted(TYPO_MAP.items(), key=lambda x: -len(x[0])):
        q = re.sub(r"\b" + re.escape(wrong) + r"\b", right, q)
    return q


def classify(question: str) -> str:
    """
    Classify the user question into an intent category using multi-signal scoring.
    Possible intents:
      - SUMMARY
      - FAILURE_RATE
      - STATUS_COUNTS
      - CHART_DATA
      - LIST_RECORDS
      - EXPIRING_SOON
      - OVERDUE
      - UNRECOGNIZED
    """
    q = normalize(question)
    scores = Counter()

    # --- 1. OVERDUE (highest priority keyword check) ---
    if re.search(r"\b(overdue|past due|lapsed|lapse|already expired)\b", q):
        scores["OVERDUE"] += 10

    # --- 2. EXPIRING_SOON ---
    if re.search(r"\b(expir(ing|es|ation|y)|expire soon|ending soon|about to expire|due soon|near expiry|close to expiring|running out)\b", q):
        scores["EXPIRING_SOON"] += 8
    if re.search(r"\b(certificate|insurance)\b", q) and re.search(r"\b(expir|due|valid)\b", q):
        scores["EXPIRING_SOON"] += 4

    # --- 3. SUMMARY / OVERVIEW ---
    if re.search(r"\b(summary|overview|dashboard|all tests|every test|status of all|overall status|full report|complete report)\b", q):
        scores["SUMMARY"] += 8
    if re.search(r"\b(analyze|breakdown|break down|audit)\b", q) and not re.search(r"\b(fail|pass)\b", q):
        scores["SUMMARY"] += 4

    # --- 4. LIST / SHOW RECORDS ---
    if re.search(r"\b(list|show|get|fetch|display|find|give me|tell me|pull up|bring up)\b.*\b(record|records|data|rows?|entries|entry|stores?|facility|facilities)\b", q):
        scores["LIST_RECORDS"] += 7
    if re.search(r"\b(all records|store records|records for store|compliance records)\b", q):
        scores["LIST_RECORDS"] += 6
    if re.search(r"\b(where is store|details for store)\b", q):
        scores["LIST_RECORDS"] += 5
    # Store number alone strongly suggests list
    if re.search(r"\b(?:store|station|facility|location|no\.?|number)\s*#?\s*\d+\b", q):
        scores["LIST_RECORDS"] += 4

    # --- 5. CHART / VISUALIZATION ---
    if re.search(r"\b(chart|graph|plot|visualize|draw|render|histogram|histo|visual|visualisation|visualization)\b", q):
        scores["CHART_DATA"] += 6
    if re.search(r"\b(pie|doughnut|donut|bar|line|scatter|radar|polar)\b", q):
        scores["CHART_DATA"] += 4
    if re.search(r"\b(trend|over time|timeline|monthly|weekly|by month|by year|time series)\b", q):
        scores["CHART_DATA"] += 6

    # --- 6. COMPARISON / RATIO ---
    if re.search(r"\b(compare|comparison|versus|vs\.?|vs )\b", q):
        scores["CHART_DATA"] += 5
    if re.search(r"\b(ratio|proportion|fail to pass|pass to fail)\b", q):
        scores["CHART_DATA"] += 4

    # --- 7. FAILURE RATE ---
    if re.search(r"\b(failure rate|fail rate|rate of failure|percentage.*fail|fail.*%|failing rate|how much failure)\b", q):
        scores["FAILURE_RATE"] += 8
    if re.search(r"\b(overall failure|overall rate)\b", q):
        scores["FAILURE_RATE"] += 8
    if re.search(r"\b(how many.*fail|number of.*fail|total.*fail)\b", q):
        scores["STATUS_COUNTS"] += 6
        scores["FAILURE_RATE"] += 3
    elif re.search(r"\bfail(ure|ed|ing|s|ures)?\b", q) and re.search(r"\b(rate|percent|percentage|portion)\b", q):
        scores["FAILURE_RATE"] += 6
    # "how many broken" / "how many not passing" → failure/counts
    if re.search(r"\b(broken|not passing|not working)\b", q):
        scores["FAILURE_RATE"] += 3

    # --- 8. STATUS COUNTS ---
    if re.search(r"\b(how many|count|number of|total number|stats for)\b.*\b(pass(es|ed|ing)?|fail(s|ed|ing|ure|ures)?|pending|tests?|inspections?)\b", q):
        scores["STATUS_COUNTS"] += 7
    if re.search(r"\b(pass|fail|pending)\b.*\b(count|how many|total|number)\b", q):
        scores["STATUS_COUNTS"] += 7
    if re.search(r"\b(pass count|fail count|pending count|status count|status breakdown)\b", q):
        scores["STATUS_COUNTS"] += 6
    if re.search(r"\bhow many tests\b", q):
        scores["STATUS_COUNTS"] += 5

    if not scores:
        return "UNRECOGNIZED"

    top_intent, top_score = scores.most_common(1)[0]
    return top_intent if top_score > 0 else "UNRECOGNIZED"


def extract_chart_type(question: str) -> str:
    """Extract requested chart type, prioritizing longest keyword match."""
    q = normalize(question)
    matches = []
    for keyword, chart_type in CHART_TYPES.items():
        if keyword in q:
            matches.append((len(keyword), chart_type))

    if matches:
        matches.sort(key=lambda x: -x[0])
        return matches[0][1]

    # Defaults based on intent context if not explicitly mentioned
    if re.search(r"\b(trend|over time|timeline|monthly)\b", q):
        return "line"
    if re.search(r"\b(scatter|correlation|vs|versus)\b", q):
        return "scatter"
    if re.search(r"\b(ratio|distribution|breakdown|share|proportion)\b", q):
        return "pie"

    return "bar"


def extract_test_type(question: str) -> Optional[str]:
    """Extract canonical test type from question using alias mapping, canonical list, and fuzzy matching."""
    q = normalize(question)
    # Check aliases sorted by descending length
    for alias, canonical in sorted(ABBREV_MAP.items(), key=lambda x: -len(x[0])):
        pattern = r"\b" + re.escape(alias) + r"\b"
        if re.search(pattern, q):
            return canonical

    for t in TEST_TYPES:
        if t.lower() in q:
            return t

    # Fuzzy fallback: slide a window of 1-3 tokens over the question and
    # check against all known aliases using token_set_ratio
    words = q.split()
    for window in range(3, 0, -1):
        for i in range(len(words) - window + 1):
            chunk = " ".join(words[i : i + window])
            if len(chunk) < 3:
                continue
            for alias, canonical in ABBREV_MAP.items():
                score = fuzz.token_set_ratio(chunk, alias)
                if score >= 82:
                    return canonical

    return None


def extract_two_test_types(question: str) -> Tuple[Optional[str], Optional[str]]:
    """Extract two distinct test types for comparisons or scatter plots."""
    q = normalize(question)
    found = []

    for alias, canonical in sorted(ABBREV_MAP.items(), key=lambda x: -len(x[0])):
        pattern = r"\b" + re.escape(alias) + r"\b"
        if re.search(pattern, q) and canonical not in found:
            found.append(canonical)
            if len(found) == 2:
                return (found[0], found[1])

    for t in TEST_TYPES:
        if t.lower() in q and t not in found:
            found.append(t)
            if len(found) == 2:
                return (found[0], found[1])

    # Fuzzy fallback for comparison queries
    if len(found) < 2:
        words = q.split()
        for window in range(3, 0, -1):
            for i in range(len(words) - window + 1):
                chunk = " ".join(words[i : i + window])
                if len(chunk) < 3:
                    continue
                for alias, canonical in ABBREV_MAP.items():
                    if fuzz.token_set_ratio(chunk, alias) >= 82 and canonical not in found:
                        found.append(canonical)
                        if len(found) == 2:
                            return (found[0], found[1])

    return (found[0] if found else None, None)


def extract_status(question: str) -> Optional[str]:
    """Extract PASS, FAIL, or PENDING."""
    q = normalize(question)
    for s in STATUS_VALUES:
        pattern = r"\b" + s.lower() + r"(ed|ing|es)?\b"
        if re.search(pattern, q):
            return s
    return None


def extract_store_number(question: str) -> Optional[int]:
    """Extract store number from patterns like 'store #38', 'store 38', 'station 12', '#45'."""
    q = normalize(question)
    m = re.search(r"\b(?:store|station|facility|location|no\.?|number)\s*#?\s*(\d+)\b", q)
    if m:
        return int(m.group(1))

    m = re.search(r"#\s*(\d+)\b", q)
    if m:
        return int(m.group(1))

    return None


def is_ratio_query(question: str) -> bool:
    q = normalize(question)
    return bool(re.search(r"\b(ratio|proportion|percent|percentage|split|breakdown|share)\b", q))
