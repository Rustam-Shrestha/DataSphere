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
    # Chart typos
    "pi chart": "pie chart",
    "py chart": "pie chart",
    "barchart": "bar chart",
    "linee": "line",
    "linegraph": "line graph",
    "piechart": "pie chart",
    "histrogram": "histogram",
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


def wants_chart(question: str) -> bool:
    """Returns True only when the user explicitly requests visual/chart output."""
    q = normalize(question)
    return bool(re.search(
        r"\b(chart|graph|plot|visuali[sz]e|visuali[sz]ation|draw|render|histogram|histo|"
        r"pie|doughnut|donut|bar|line|scatter|radar|polar|trend|over time|timeline)\b",
        q,
    ))


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
        scores["OVERDUE"] += 12

    # --- 2. EXPIRING_SOON ---
    if re.search(r"\b(expir(ing|es|ation|y)|expire soon|ending soon|about to expire|due soon|near expiry|close to expiring|running out)\b", q):
        scores["EXPIRING_SOON"] += 10
    if re.search(r"\b(certificate|insurance)\b", q) and re.search(r"\b(expir|due|valid)\b", q):
        scores["EXPIRING_SOON"] += 5

    # --- 3. SUMMARY / OVERVIEW ---
    if re.search(r"\b(summary|overview|dashboard|all tests|every test|status of all|overall status|full report|complete report)\b", q):
        scores["SUMMARY"] += 10
    if re.search(r"\b(analyze|breakdown|break down|audit)\b", q) and not re.search(r"\b(fail|pass)\b", q):
        scores["SUMMARY"] += 5

    # --- 4. LIST / SHOW RECORDS ---
    if re.search(r"\b(list|show|get|fetch|display|find|give me|tell me|pull up|bring up)\b.*\b(record|records|data|rows?|entries|entry|stores?|facility|facilities)\b", q):
        scores["LIST_RECORDS"] += 8
    if re.search(r"\b(all records|store records|records for store|compliance records)\b", q):
        scores["LIST_RECORDS"] += 7
    if re.search(r"\b(where is store|details for store)\b", q):
        scores["LIST_RECORDS"] += 6
    if re.search(r"\b(?:store|station|facility|location|no\.?|number)\s*#?\s*\d+\b", q) and not re.search(r"\b(rate|percent|count|how many)\b", q):
        scores["LIST_RECORDS"] += 5

    # --- 5. CHART / VISUALIZATION ---
    # Give high score only if user explicitly asks to plot/graph/visualize
    if re.search(r"\b(chart|graph|plot|visualize|draw|render|histogram|histo|visual|visualisation|visualization)\b", q):
        scores["CHART_DATA"] += 8
    if re.search(r"\b(pie chart|doughnut chart|donut chart|bar chart|bar graph|line chart|line graph|scatter plot|radar chart|polar chart)\b", q):
        scores["CHART_DATA"] += 8
    elif re.search(r"\b(pie|doughnut|donut|bar|line|scatter|radar|polar)\b", q) and not re.search(r"\b(how many|count|rate|percent)\b", q):
        scores["CHART_DATA"] += 5
    if re.search(r"\b(trend|over time|timeline|monthly|weekly|by month|by year|time series)\b", q):
        scores["CHART_DATA"] += 7

    # --- 6. COMPARISON / RATIO ---
    if re.search(r"\b(compare|comparison|versus|vs\.?|vs )\b", q):
        scores["CHART_DATA"] += 6
    if re.search(r"\b(ratio|proportion|fail to pass|pass to fail)\b", q) and not re.search(r"\bhow many\b", q):
        scores["CHART_DATA"] += 4

    # --- 7. FAILURE RATE (Must have rate/percent words OR pass rate/fail rate) ---
    is_explicit_rate = bool(re.search(r"\b(failure rate|fail rate|rate of failure|percentage.*fail|fail.*%|failing rate|pass rate|rate of pass|success rate)\b", q))
    if is_explicit_rate:
        scores["FAILURE_RATE"] += 12
    if re.search(r"\b(overall failure|overall rate)\b", q):
        scores["FAILURE_RATE"] += 10
    if re.search(r"\b(pass rate|fail rate)\b", q) and re.search(r"\ball\b", q):
        scores["FAILURE_RATE"] += 10
    if re.search(r"\bfail(ure|ed|ing|s|ures)?\b", q) and re.search(r"\b(rate|percent|percentage|portion)\b", q):
        scores["FAILURE_RATE"] += 8

    # --- 8. STATUS COUNTS (Targeted count/how many questions) ---
    is_count_query = bool(re.search(r"\b(how many|count|number of|total number|stats for)\b", q))
    if is_count_query and re.search(r"\b(fail(s|ed|ing|ure|ures)?|pass(es|ed|ing)?|pending|other|neither|exempt|n/?a)\b", q):
        scores["STATUS_COUNTS"] += 12
    elif is_count_query:
        scores["STATUS_COUNTS"] += 8

    if re.search(r"\b(pass|fail|pending)\b.*\b(count|how many|total|number)\b", q):
        scores["STATUS_COUNTS"] += 9
    if re.search(r"\b(pass count|fail count|pending count|status count|status breakdown)\b", q):
        scores["STATUS_COUNTS"] += 8
    if re.search(r"\bneither pass nor fail\b", q) or re.search(r"\bno pass or fail\b", q) or re.search(r"\bnot pass and not fail\b", q):
        scores["STATUS_COUNTS"] += 12

    if not scores:
        return "UNRECOGNIZED"

    # Tie-breaking rules:
    # 1. If "how many" or "count" was asked and there is NO explicit "rate" or "%", STATUS_COUNTS must win over FAILURE_RATE
    if is_count_query and not is_explicit_rate:
        if "STATUS_COUNTS" in scores and "FAILURE_RATE" in scores:
            scores["STATUS_COUNTS"] = max(scores["STATUS_COUNTS"], scores["FAILURE_RATE"] + 2)

    # 2. If chart was requested alongside scalar question ("how many failures as bar chart"),
    # we treat it as STATUS_COUNTS but wants_chart() will flag that a chart should be attached.
    if is_count_query and "CHART_DATA" in scores:
        if scores["STATUS_COUNTS"] >= scores["CHART_DATA"] - 2:
            scores["STATUS_COUNTS"] = scores["CHART_DATA"] + 1

    top_intent, top_score = scores.most_common(1)[0]
    return top_intent if top_score > 0 else "UNRECOGNIZED"


def extract_chart_type(question: str) -> str:
    """Extract requested chart type, prioritizing longest keyword match with fuzzy fallback."""
    q = normalize(question)
    matches = []
    for keyword, chart_type in CHART_TYPES.items():
        if keyword in q:
            matches.append((len(keyword), chart_type))

    if matches:
        matches.sort(key=lambda x: -x[0])
        return matches[0][1]

    # Fuzzy check for typos like 'pi chart', 'linee', 'barr'
    words = q.split()
    for w in words:
        if len(w) >= 3:
            for kw, ctype in CHART_TYPES.items():
                kw_head = kw.split()[0]
                if fuzz.ratio(w, kw_head) >= 80:
                    return ctype

    # Contextual defaults if not explicitly named
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

    # Fuzzy fallback: slide a window of 1-3 tokens over the question
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
    """Extract PASS, FAIL, PENDING, or OTHER/NEITHER."""
    q = normalize(question)
    if re.search(r"\b(neither pass nor fail|no pass or fail|other|neither)\b", q):
        return "OTHER"
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
