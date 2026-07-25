from . import intents, entities, templates
from ..db import get_connection, list_distinct_cities
from ..schemas import QueryResponse


def _build_chart(intent: str, rows: list[dict]) -> dict | None:
    if intent in ("FAILURE_RATE", "STATUS_COUNTS") and rows:
        labels = [r["status"] for r in rows]
        values = [r["cnt"] for r in rows]
        return {"type": "pie", "labels": labels, "values": values}
    if intent == "CHART_DATA" and rows:
        labels = [r["test"] for r in rows]
        values = [r["pass_count"] + r["fail_count"] for r in rows]
        return {"type": "bar", "labels": labels, "values": values}
    if intent == "EXPIRING_SOON" and rows:
        labels = [r["type"] for r in rows]
        values = [r["cnt"] for r in rows]
        return {"type": "bar", "labels": labels, "values": values}
    if intent == "OVERDUE" and rows:
        labels = [r["type"] for r in rows]
        values = [r["cnt"] for r in rows]
        return {"type": "bar", "labels": labels, "values": values}
    return None


def _build_answer(
    intent: str,
    sql: str,
    rows: list[dict],
    test_type: str | None,
    city: str | None,
    store_number: int | None,
    status_filter: str | None,
) -> str:
    if intent == "FAILURE_RATE":
        total = sum(r["cnt"] for r in rows)
        fail_count = next((r["cnt"] for r in rows if r["status"] == "FAIL"), 0)
        pct = round((fail_count / total) * 100) if total else 0
        parts = [f"{r['status']}: {r['cnt']}" for r in rows]
        desc = test_type or "tests"
        loc = f" in {city}" if city else ""
        store = f" at store #{store_number}" if store_number else ""
        return f"{desc}{loc}{store}: {pct}% failure rate ({fail_count} failures out of {total}). Breakdown: {', '.join(parts)}."

    if intent == "STATUS_COUNTS":
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
        parts = [f"{r['test']}: {r['pass_count']} pass, {r['fail_count']} fail" for r in rows]
        return f"Chart data by test type: {'; '.join(parts)}."

    return ""


def handle(question: str) -> QueryResponse:
    intent = intents.classify(question)
    date_range = entities.extract_date_range(question) or entities.extract_month(question)
    test_type = intents.extract_test_type(question)
    status_filter = intents.extract_status(question)
    store_number = intents.extract_store_number(question)

    if intent == "UNRECOGNIZED":
        return QueryResponse(
            intent="unrecognized",
            answer=(
                "I can answer questions about compliance test records. Try asking:\n"
                "- What's the failure rate for Corrosion tests?\n"
                "- How many Spill Buckets tests passed?\n"
                "- Show me records for store #38\n"
                "- What certificates are expiring?\n"
                "- Show me a chart of all test results"
            ),
            sql="",
            rows=[],
            chart=None,
        )

    known_cities = list_distinct_cities()
    city = entities.extract_city(question, known_cities)

    if intent in ("FAILURE_RATE", "STATUS_COUNTS"):
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

        if intent == "FAILURE_RATE":
            sql, params = templates.failure_rate_sql(test_type, city, store_number)
        else:
            sql, params = templates.status_counts_sql(test_type, status_filter, city, store_number)

    elif intent == "LIST_RECORDS":
        sql, params = templates.list_records_sql(city, store_number)

    elif intent == "EXPIRING_SOON":
        import re
        m = re.search(r"(\d+)\s*days?", question)
        days = min(90, max(1, int(m.group(1)))) if m else 30
        sql, params = templates.expiring_soon_sql(days)

    elif intent == "OVERDUE":
        sql, params = templates.overdue_sql()

    elif intent == "CHART_DATA":
        sql, params = templates.chart_data_sql()

    else:
        return QueryResponse(
            intent="unrecognized",
            answer="I don't understand that question yet.",
            sql="",
            rows=[],
            chart=None,
        )

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            rows = [dict(r) for r in cur.fetchall()]

    answer = _build_answer(intent, sql, rows, test_type, city, store_number, status_filter)
    chart = _build_chart(intent, rows)

    return QueryResponse(
        intent=intent.lower(),
        answer=answer,
        sql=sql,
        rows=rows,
        chart=chart,
    )
