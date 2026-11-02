"""
Pipeline: orchestrates intent classification, entity extraction, SQL generation,
query execution, chart building, and answer summarization.
"""

import logging
import re
from typing import Optional, List, Dict, Any

from . import intents, entities, templates, summarizer
from ..db import get_connection, list_distinct_cities
from ..schemas import QueryResponse, Chart, Dataset

logger = logging.getLogger("nlu.pipeline")

PALETTE = [
    "#10b981", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6",
    "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
]


# ---------------------------------------------------------------------------
# Chart builders
# ---------------------------------------------------------------------------

def _build_pie_chart(title: str, labels: List[str], values: List[int], chart_type: str = "pie") -> Chart:
    colors = []
    for label in labels:
        l_upper = str(label).upper()
        if "PASS" in l_upper:
            colors.append("#22c55e")
        elif "FAIL" in l_upper:
            colors.append("#ef4444")
        elif "PENDING" in l_upper:
            colors.append("#f59e0b")
        else:
            colors.append(PALETTE[len(colors) % len(PALETTE)])

    return Chart(
        type=chart_type if chart_type in ("pie", "doughnut", "polarArea") else "pie",
        title=title,
        labels=labels,
        values=values,
        datasets=[Dataset(label=title, data=values, backgroundColor=colors)],
    )


def _build_bar_chart(title: str, labels: List[str], dataset_label: str, data: List[int], chart_type: str = "bar") -> Chart:
    colors = []
    for label in labels:
        l_upper = str(label).upper()
        if "PASS" in l_upper:
            colors.append("#22c55e")
        elif "FAIL" in l_upper:
            colors.append("#ef4444")
        elif "PENDING" in l_upper:
            colors.append("#f59e0b")
        else:
            colors.append(PALETTE[len(colors) % len(PALETTE)])

    return Chart(
        type="bar",
        title=title,
        labels=labels,
        values=data,
        datasets=[Dataset(label=dataset_label, data=data, backgroundColor=colors)],
        yLabel="Count",
    )


def _build_grouped_bar_chart(title: str, labels: List[str], pass_vals: List[int], fail_vals: List[int]) -> Chart:
    return Chart(
        type="bar",
        title=title,
        labels=labels,
        datasets=[
            Dataset(label="Pass", data=pass_vals, backgroundColor="#22c55e"),
            Dataset(label="Fail", data=fail_vals, backgroundColor="#ef4444"),
        ],
        yLabel="Count",
    )


def _build_line_chart(title: str, labels: List[str], pass_vals: List[int], fail_vals: List[int]) -> Chart:
    return Chart(
        type="line",
        title=title,
        labels=labels,
        datasets=[
            Dataset(
                label="Passed Tests",
                data=pass_vals,
                borderColor="#22c55e",
                backgroundColor="#22c55e20",
                fill=True,
                pointRadius=4,
            ),
            Dataset(
                label="Failed Tests",
                data=fail_vals,
                borderColor="#ef4444",
                backgroundColor="#ef444420",
                fill=True,
                pointRadius=4,
            ),
        ],
        xLabel="Month (YYYY-MM)",
        yLabel="Number of Tests",
    )


def _build_scatter_chart(title: str, points: List[Dict[str, Any]], x_label: str, y_label: str) -> Chart:
    return Chart(
        type="scatter",
        title=title,
        labels=[],
        datasets=[Dataset(
            label=title,
            data=[{"x": p["x"], "y": p["y"]} for p in points],
            backgroundColor="#3b82f6",
            pointRadius=6,
        )],
        xLabel=x_label,
        yLabel=y_label,
    )


def _build_radar_chart(title: str, labels: List[str], pass_vals: List[int], fail_vals: List[int]) -> Chart:
    return Chart(
        type="radar",
        title=title,
        labels=labels,
        datasets=[
            Dataset(label="Pass", data=pass_vals, borderColor="#22c55e", backgroundColor="#22c55e30", fill=True),
            Dataset(label="Fail", data=fail_vals, borderColor="#ef4444", backgroundColor="#ef444430", fill=True),
        ],
    )


# ---------------------------------------------------------------------------
# Chart router
# ---------------------------------------------------------------------------

def _build_chart(
    intent: str,
    rows: List[Dict[str, Any]],
    chart_type: str,
    test_type: Optional[str] = None,
    second_test: Optional[str] = None,
) -> Optional[Chart]:
    if not rows:
        return None

    row0 = rows[0]

    # 1. Trend queries with 'period'
    if "period" in row0:
        labels = [str(r["period"]) for r in rows]
        pass_vals = [int(r.get("pass_count", 0)) for r in rows]
        fail_vals = [int(r.get("fail_count", 0)) for r in rows]
        title = f"{test_type or 'Compliance'} - Trend Over Time"
        return _build_line_chart(title, labels, pass_vals, fail_vals)

    # 2. Scatter queries with 'test_a' and 'test_b'
    if "test_a" in row0 and "test_b" in row0:
        # Map categorical status to numbers: PASS: 2, PENDING: 1, FAIL: 0 with minor jitter
        score_map = {"PASS": 2.0, "PENDING": 1.0, "FAIL": 0.0}
        points = []
        import random
        for r in rows:
            base_x = score_map.get(str(r.get("test_a", "")).upper(), 1.0)
            base_y = score_map.get(str(r.get("test_b", "")).upper(), 1.0)
            # Add slight jitter for visual distinction on discrete grid
            jitter_x = round(base_x + random.uniform(-0.08, 0.08), 2)
            jitter_y = round(base_y + random.uniform(-0.08, 0.08), 2)
            points.append({"x": jitter_x, "y": jitter_y})

        name_a = test_type or "Test A"
        name_b = second_test or "Test B"
        return _build_scatter_chart(
            f"{name_a} vs {name_b} Correlation (0=Fail, 1=Pending, 2=Pass)",
            points,
            name_a,
            name_b,
        )

    # 3. Test summary / comparison rows with 'test' and 'pass_count'
    if "test" in row0 and "pass_count" in row0:
        labels = [str(r["test"]) for r in rows]
        pass_vals = [int(r.get("pass_count", 0)) for r in rows]
        fail_vals = [int(r.get("fail_count", 0)) for r in rows]
        title = "Compliance Test Results (Pass vs Fail)"

        if chart_type in ("pie", "doughnut", "polarArea"):
            # Sum total tests per category
            totals = [p + f for p, f in zip(pass_vals, fail_vals)]
            return _build_pie_chart("Test Distribution by Type", labels, totals, chart_type)
        if chart_type == "radar":
            return _build_radar_chart(title, labels, pass_vals, fail_vals)
        if chart_type == "line":
            return _build_line_chart(title, labels, pass_vals, fail_vals)

        return _build_grouped_bar_chart(title, labels, pass_vals, fail_vals)

    # 4. Status distribution rows with 'status' and 'cnt'
    if "status" in row0 and "cnt" in row0:
        labels = [str(r["status"]) for r in rows]
        vals = [int(r["cnt"]) for r in rows]
        title = f"{test_type or 'All Tests'} - Status Distribution"

        if chart_type in ("pie", "doughnut", "polarArea"):
            return _build_pie_chart(title, labels, vals, chart_type)
        if chart_type == "radar":
            return _build_radar_chart(title, labels, vals, [0] * len(vals))
        return _build_bar_chart(title, labels, "Count", vals)

    # 5. Histogram / binned distribution with 'label' and 'cnt'
    if "label" in row0 and "cnt" in row0:
        labels = [str(r["label"]) for r in rows]
        vals = [int(r["cnt"]) for r in rows]
        title = f"{test_type or 'Store Failure'} - Frequency Distribution"
        return _build_bar_chart(title, labels, "Store Count", vals)

    # 6. Expiration / Overdue items with 'type' and 'cnt'
    if "type" in row0 and "cnt" in row0:
        labels = [str(r["type"]) for r in rows]
        vals = [int(r["cnt"]) for r in rows]
        title = "Expiring Certificates" if intent == "EXPIRING_SOON" else "Overdue Renewals"
        if chart_type in ("pie", "doughnut"):
            return _build_pie_chart(title, labels, vals, chart_type)
        return _build_bar_chart(title, labels, "Count", vals)

    return None


# ---------------------------------------------------------------------------
# Main Handler
# ---------------------------------------------------------------------------

def handle(question: str) -> QueryResponse:
    """Entry point for natural-language queries."""
    try:
        return _handle(question)
    except Exception as e:
        logger.exception("Error processing compliance question: %s", question)
        return QueryResponse(
            intent="error",
            answer=f"Could not execute query due to an internal error: {e}",
            sql="",
            rows=[],
            chart=None,
        )


def _handle(question: str) -> QueryResponse:
    q_norm = intents.normalize(question)
    intent = intents.classify(question)
    chart_type = intents.extract_chart_type(question)
    test_type = intents.extract_test_type(question)
    status_filter = intents.extract_status(question)
    store_number = intents.extract_store_number(question)
    n_days = entities.extract_n_days(question, default=30)

    has_trend = bool(re.search(r"\b(trend|over time|timeline|monthly|weekly|daily)\b", q_norm))
    has_histo = bool(re.search(r"\b(histogram|histo|frequency|distribution of fail)\b", q_norm))
    has_compare = bool(re.search(r"\b(compare|comparison|versus|vs\.?|vs )\b", q_norm))
    is_summary = (intent == "SUMMARY") or bool(re.search(r"\b(summary|overview|all tests|every test)\b", q_norm))

    # Look up known cities from the database
    known_cities = list_distinct_cities()
    city = entities.extract_city(question, known_cities)

    test_a, test_b = intents.extract_two_test_types(question)

    if intent == "UNRECOGNIZED":
        # Best-effort: if any test type signal exists, attempt a summary
        if test_type:
            sql, params = templates.failure_rate_sql(test_type, city, store_number)
            with get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(sql, params)
                    rows = [dict(r) for r in cur.fetchall()]
            chart = _build_chart(intent="FAILURE_RATE", rows=rows, chart_type=chart_type, test_type=test_type)
            answer = summarizer.build_text_answer(
                intent="FAILURE_RATE", rows=rows, test_type=test_type,
                city=city, store_number=store_number, status_filter=status_filter, chart_type=chart_type,
            )
            return QueryResponse(intent="failure_rate", answer=answer, sql=sql, rows=rows[:50], chart=chart)

        # No clear signal at all — short, polite one-liner
        return QueryResponse(
            intent="unrecognized",
            answer=(
                "I couldn't quite understand that. Try asking about test failure rates, "
                "pass/fail counts, charts, record lookups, or certificate expirations."
            ),
            sql="",
            rows=[],
            chart=None,
        )

    # Route intent to SQL template
    sql: str = ""
    params: tuple = ()

    if intent == "FAILURE_RATE":
        sql, params = templates.failure_rate_sql(test_type, city, store_number)

    elif intent == "STATUS_COUNTS":
        sql, params = templates.status_counts_sql(test_type, status_filter, city, store_number)

    elif intent == "SUMMARY" or is_summary:
        intent = "SUMMARY"
        sql, params = templates.summary_sql(city, store_number)

    elif intent == "EXPIRING_SOON":
        sql, params = templates.expiring_soon_sql(n_days)

    elif intent == "OVERDUE":
        sql, params = templates.overdue_sql()

    elif intent == "LIST_RECORDS":
        sql, params = templates.list_records_sql(city, store_number)

    elif intent == "CHART_DATA":
        if has_trend:
            sql, params = templates.trend_sql(test_type, city, store_number)
        elif has_histo:
            sql, params = templates.histogram_sql(test_type, city, store_number)
        elif has_compare and test_a and test_b:
            if chart_type == "scatter":
                sql, params = templates.scatter_data_sql(test_a, test_b, city, store_number)
            else:
                sql, params = templates.comparison_sql(test_a, test_b, city, store_number)
        else:
            if test_type:
                sql, params = templates.failure_rate_sql(test_type, city, store_number)
            else:
                sql, params = templates.summary_sql(city, store_number)

    else:
        sql, params = templates.overall_failure_rate_sql(city, store_number)

    # Execute SQL in PostgreSQL
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            rows = [dict(r) for r in cur.fetchall()]

    # Build Chart
    chart = _build_chart(
        intent=intent,
        rows=rows,
        chart_type=chart_type,
        test_type=test_type or test_a,
        second_test=test_b,
    )

    # Build Text Answer
    answer = summarizer.build_text_answer(
        intent=intent,
        rows=rows,
        test_type=test_type,
        city=city,
        store_number=store_number,
        status_filter=status_filter,
        chart_type=chart_type,
    )

    return QueryResponse(
        intent=intent.lower(),
        answer=answer,
        sql=sql,
        rows=rows[:50],  # Return up to 50 rows for inline table inspection
        chart=chart,
    )
