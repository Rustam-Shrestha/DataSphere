"""
Pipeline: orchestrates intent classification, entity extraction, SQL generation,
chart building, and answer formatting.
"""

import logging
import re

from . import intents, entities, templates
from ..db import get_connection, list_distinct_cities
from ..schemas import QueryResponse, Chart, Dataset

logger = logging.getLogger("nlu.pipeline")


# ---------------------------------------------------------------------------
# Chart builders — each returns a Chart model or None
# ---------------------------------------------------------------------------

def _build_pie_chart(title: str, labels: list[str], values: list) -> Chart:
    """Build a pie-style chart (pie, doughnut, polarArea)."""
    from random import shuffle
    colors = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16"]
    bg = colors[:len(labels)]
    return Chart(
        type="pie", title=title,
        labels=labels, values=values,
        datasets=[Dataset(label=title, data=values, backgroundColor=bg)],
    )


def _build_bar_chart(title: str, labels: list[str], dataset_label: str, data: list,
                     bg_color: str | None = None) -> Chart:
    """Build a bar chart with a single dataset."""
    colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"]
    bg = [colors[i % len(colors)] for i in range(len(labels))] if len(labels) <= len(colors) else colors[0]
    return Chart(
        type="bar", title=title,
        labels=labels,
        datasets=[Dataset(label=dataset_label, data=data, backgroundColor=bg)],
        yLabel="Count",
    )


def _build_line_chart(title: str, labels: list[str], datasets: list[dict]) -> Chart:
    """Build a line chart from one or more series.

    Each dataset dict: {label, data, color?}
    """
    ds = []
    colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"]
    for i, src in enumerate(datasets):
        c = src.get("color", colors[i % len(colors)])
        ds.append(Dataset(
            label=src["label"],
            data=src["data"],
            borderColor=c,
            backgroundColor=c + "20",  # semi-transparent fill
            fill=True,
            pointRadius=3,
        ))
    return Chart(
        type="line", title=title,
        labels=labels, datasets=ds,
        xLabel="Period", yLabel="Count",
    )


def _build_scatter_chart(title: str, points: list[dict], x_label: str, y_label: str) -> Chart:
    """Build a scatter chart from {x: num, y: num} points."""
    return Chart(
        type="scatter", title=title,
        labels=[],
        datasets=[Dataset(
            label=title,
            data=[{"x": p["x"], "y": p["y"]} for p in points],
            backgroundColor="#3b82f6",
            pointRadius=5,
        )],
        xLabel=x_label, yLabel=y_label,
    )


def _build_radar_chart(title: str, labels: list[str], datasets: list[dict]) -> Chart:
    """Build a radar chart with multiple axes."""
    ds = []
    colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"]
    for i, src in enumerate(datasets):
        c = colors[i % len(colors)]
        ds.append(Dataset(
            label=src["label"],
            data=src["data"],
            borderColor=c,
            backgroundColor=c + "40",
            fill=False,
        ))
    return Chart(
        type="radar", title=title,
        labels=labels, datasets=ds,
    )


# ---------------------------------------------------------------------------
# Answer builders
# ---------------------------------------------------------------------------

def _build_answer(
    intent: str,
    sql: str,
    rows: list[dict],
    test_type: str | None,
    city: str | None,
    store_number: int | None,
    status_filter: str | None,
    chart_type: str | None,
) -> str:
    if intent == "FAILURE_RATE":
        if not rows:
            return "No test results found."
        total = sum(r["cnt"] for r in rows)
        fail_count = next((r["cnt"] for r in rows if r["status"] == "FAIL"), 0)
        pct = round((fail_count / total) * 100) if total else 0
        parts = [f"{r['status']}: {r['cnt']}" for r in rows]
        desc = test_type or "tests"
        loc = f" in {city}" if city else ""
        store = f" at store #{store_number}" if store_number else ""
        return f"{desc}{loc}{store}: {pct}% failure rate ({fail_count} failures out of {total}). Breakdown: {', '.join(parts)}."

    if intent == "STATUS_COUNTS":
        if not rows:
            return "No matching results found."
        parts = [f"{r['status']}: {r['cnt']}" for r in rows]
        desc = f" for {test_type}" if test_type else ""
        loc = f" in {city}" if city else ""
        store = f" at store #{store_number}" if store_number else ""
        return f"Status counts{desc}{loc}{store}: {', '.join(parts)}."

    if intent == "LIST_RECORDS":
        if not rows:
            return "No matching records found."
        return f"Found {len(rows)} record(s). Browse the Data page for full details."

    if intent == "EXPIRING_SOON":
        if not rows:
            return "No certificates are expiring soon."
        parts = [f"{r['cnt']} {r['type']}(s)" for r in rows]
        return f"{sum(r['cnt'] for r in rows)} certificate(s) expiring soon: {', '.join(parts)}."

    if intent == "OVERDUE":
        if not rows:
            return "No overdue items found."
        parts = [f"{r['cnt']} {r['type']}(s)" for r in rows]
        return f"{sum(r['cnt'] for r in rows)} overdue item(s): {', '.join(parts)}."

    if intent == "CHART_DATA":
        if not rows:
            return "No chart data available."
        chart_label = chart_type or "bar"
        return f"Here's a {chart_label} chart of your compliance data."

    return ""


# ---------------------------------------------------------------------------
# Chart routing by intent + chart_type
# ---------------------------------------------------------------------------

def _build_chart(
    intent: str,
    rows: list[dict],
    chart_type: str,
    test_type: str | None,
    second_test: str | None,
) -> Chart | None:
    """Route to the correct chart builder based on intent and requested chart type."""
    if not rows:
        return None

    # --- FAILURE_RATE / STATUS_COUNTS: distribution data (status → count) ---
    if intent in ("FAILURE_RATE", "STATUS_COUNTS") and "status" in rows[0]:
        labels = [r["status"] for r in rows]
        vals = [r["cnt"] for r in rows]
        title = test_type or "All Tests"

        if chart_type == "pie":
            return _build_pie_chart(f"{title} — Status Distribution", labels, vals)
        elif chart_type == "doughnut":
            c = _build_pie_chart(f"{title} — Status Distribution", labels, vals)
            c.type = "doughnut"
            return c
        elif chart_type == "polarArea":
            c = _build_pie_chart(f"{title} — Status Distribution", labels, vals)
            c.type = "polarArea"
            return c
        elif chart_type == "radar":
            return _build_radar_chart(f"{title} — Status", labels,
                                      [{"label": "Count", "data": vals}])
        else:  # bar (default)
            return _build_bar_chart(f"{title} — Status Counts", labels, "Count", vals)

    # --- EXPIRING_SOON / OVERDUE: type → count ---
    if intent in ("EXPIRING_SOON", "OVERDUE") and "type" in rows[0] and "cnt" in rows[0]:
        labels = [r["type"] for r in rows]
        vals = [r["cnt"] for r in rows]
        title = "Expiring Soon" if intent == "EXPIRING_SOON" else "Overdue Items"

        if chart_type == "pie" or chart_type == "doughnut":
            c = _build_pie_chart(title, labels, vals)
            if chart_type == "doughnut":
                c.type = "doughnut"
            return c
        else:
            return _build_bar_chart(title, labels, "Count", vals)

    # --- CHART_DATA: test → pass/fail counts ---
    if intent == "CHART_DATA" and "test" in rows[0] and "pass_count" in rows[0]:
        labels = [r["test"] for r in rows]
        pass_vals = [r["pass_count"] for r in rows]
        fail_vals = [r["fail_count"] for r in rows]
        total_vals = [p + f for p, f in zip(pass_vals, fail_vals)]

        if chart_type in ("pie", "doughnut", "polarArea"):
            # Show total tests per type as a proportion
            c = _build_pie_chart("Tests by Type", labels, total_vals)
            if chart_type == "doughnut":
                c.type = "doughnut"
            elif chart_type == "polarArea":
                c.type = "polarArea"
            return c

        elif chart_type == "line":
            # Line chart with pass/fail as separate series across test types
            return Chart(
                type="line",
                title="Test Results — Pass vs Fail",
                labels=labels,
                datasets=[
                    Dataset(label="Pass", data=pass_vals, borderColor="#22c55e",
                            backgroundColor="#22c55e20", fill=True, pointRadius=4),
                    Dataset(label="Fail", data=fail_vals, borderColor="#ef4444",
                            backgroundColor="#ef444420", fill=True, pointRadius=4),
                ],
                xLabel="Test Type", yLabel="Count",
            )

        elif chart_type == "radar":
            return _build_radar_chart("Test Results", labels, [
                {"label": "Pass", "data": pass_vals},
                {"label": "Fail", "data": fail_vals},
            ])

        elif chart_type == "scatter":
            # Encode as scatter: pass on x, fail on y
            points = [{"x": p, "y": f} for p, f in zip(pass_vals, fail_vals)]
            return _build_scatter_chart("Pass vs Fail by Test Type", points, "Pass", "Fail")

        else:  # bar with grouped data (pass/fail side-by-side)
            # Use a multi-dataset bar
            colors_pass = ["#22c55e"] * len(labels)
            colors_fail = ["#ef4444"] * len(labels)
            return Chart(
                type="bar",
                title="Test Results — Pass vs Fail",
                labels=labels,
                datasets=[
                    Dataset(label="Pass", data=pass_vals, backgroundColor=colors_pass),
                    Dataset(label="Fail", data=fail_vals, backgroundColor=colors_fail),
                ],
                yLabel="Count",
            )

    # --- Scatter data (test_a, test_b) from scatter_data_sql ---
    if "test_a" in rows[0] and "test_b" in rows[0]:
        # Encode status as numeric: PASS=2, PENDING=1, FAIL=0
        status_score = {"PASS": 2, "PENDING": 1, "FAIL": 0}
        points = []
        for r in rows:
            x = status_score.get(r.get("test_a", "PENDING"), 0)
            y = status_score.get(r.get("test_b", "PENDING"), 0)
            points.append({"x": x, "y": y})
        title = second_test or "Comparison"
        return _build_scatter_chart(
            f"{test_type} vs {title}" if test_type and title else "Test Comparison",
            points, test_type or "Test A", second_test or "Test B",
        )

    # --- Trend data (period → pass/fail) ---
    if rows and "period" in rows[0]:
        pass_by_period = {}
        fail_by_period = {}
        for r in rows:
            p = r["period"]
            pass_by_period[p] = pass_by_period.get(p, 0) + r.get("pass_count", 0)
            fail_by_period[p] = fail_by_period.get(p, 0) + r.get("fail_count", 0)

        return _build_line_chart(
            "Trend Over Time",
            list(pass_by_period.keys()),
            [
                {"label": "Pass", "data": list(pass_by_period.values())},
                {"label": "Fail", "data": list(fail_by_period.values())},
            ],
        )

    return None


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def handle(question: str) -> QueryResponse:
    """Process a natural-language question and return structured results."""
    try:
        return _handle(question)
    except Exception as e:
        logger.exception("Error processing question: %s", question)
        return QueryResponse(
            intent="error",
            answer=f"I ran into a problem processing your question: {e}. Make sure the database is running.",
            sql="",
            rows=[],
            chart=None,
        )


def _handle(question: str) -> QueryResponse:
    intent = intents.classify(question)
    chart_type = intents.extract_chart_type(question)
    test_type = intents.extract_test_type(question)
    status_filter = intents.extract_status(question)
    store_number = intents.extract_store_number(question)
    date_range = entities.extract_date_range(question) or entities.extract_month(question)
    is_ratio = intents.is_ratio_query(question)
    has_trend = bool(re.search(r"(trend|over time|timeline|monthly|weekly)", question.lower()))
    has_compare = bool(re.search(r"(compare|vs\.?|versus|vs )", question.lower()))

    if intent == "UNRECOGNIZED":
        return QueryResponse(
            intent="unrecognized",
            answer=(
                "I can answer questions about compliance test records. Try asking:\n"
                "• What's the failure rate for Corrosion tests?\n"
                "• Show me a pie chart of pass/fail for Spill Buckets\n"
                "• Plot a line chart of test trends over time\n"
                "• Draw a bar chart of all test results\n"
                "• Compare corrosion vs spill buckets (scatter)\n"
                "• What's the pass:fail ratio for ATG probes?\n"
                "• Show me records for store #38\n"
                "• What certificates are expiring?"
            ),
            sql="",
            rows=[],
            chart=None,
        )

    # Load known cities
    known_cities = list_distinct_cities()
    city = entities.extract_city(question, known_cities)

    sql: str = ""
    params: tuple = ()

    # --- ROUTE INTENT ---
    if intent == "FAILURE_RATE":
        if not test_type and not city and not store_number:
            return QueryResponse(
                intent="unrecognized",
                answer=(
                    "I couldn't find a test type, city, or store number in your question. "
                    "Try something like: 'failure rate for Corrosion' or 'how many PASS for Spill Buckets in Dallas'."
                ),
                sql="",
                rows=[],
                chart=None,
            )
        sql, params = templates.failure_rate_sql(test_type, city, store_number)

    elif intent == "STATUS_COUNTS":
        sql, params = templates.status_counts_sql(test_type, status_filter, city, store_number)

    elif intent == "LIST_RECORDS":
        sql, params = templates.list_records_sql(city, store_number)

    elif intent == "EXPIRING_SOON":
        m = re.search(r"(\d+)\s*days?", question)
        days = min(90, max(1, int(m.group(1)))) if m else 30
        sql, params = templates.expiring_soon_sql(days)

    elif intent == "OVERDUE":
        sql, params = templates.overdue_sql()

    elif intent == "CHART_DATA":
        if has_trend:
            sql, params = templates.trend_sql(test_type)
        elif is_ratio and test_type:
            sql, params = templates.pass_fail_ratio_sql(test_type)
        elif has_compare:
            a, b = intents.extract_two_test_types(question)
            if a and b:
                if chart_type == "scatter":
                    sql, params = templates.scatter_data_sql(a, b)
                else:
                    sql, params = templates.comparison_sql(a, b)
            else:
                sql, params = templates.chart_data_sql()
        else:
            sql, params = templates.chart_data_sql()

    else:
        return QueryResponse(
            intent="unrecognized",
            answer="I don't understand that question yet. Try rephrasing, or ask about failure rates, status counts, charts, or records.",
            sql="",
            rows=[],
            chart=None,
        )

    # --- EXECUTE ---
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            rows = [dict(r) for r in cur.fetchall()]

    # Determine second test type for scatter/comparison charts
    second_test = None
    if has_compare:
        a, b = intents.extract_two_test_types(question)
        second_test = b

    # --- BUILD RESPONSE ---
    answer = _build_answer(intent, sql, rows, test_type, city, store_number, status_filter, chart_type)
    chart = _build_chart(intent, rows, chart_type, test_type, second_test)

    return QueryResponse(
        intent=intent.lower(),
        answer=answer,
        sql=sql,
        rows=rows,
        chart=chart,
    )
