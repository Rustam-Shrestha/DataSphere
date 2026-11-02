"""
Summarizer module: converts query results and metadata into clear, informative answers.
"""

from typing import Optional, List, Dict, Any


def build_text_answer(
    intent: str,
    rows: List[Dict[str, Any]],
    test_type: Optional[str] = None,
    city: Optional[str] = None,
    store_number: Optional[int] = None,
    status_filter: Optional[str] = None,
    chart_type: Optional[str] = None,
) -> str:
    """Build a natural, informative answer describing the SQL query output."""
    loc = f" in **{city}**" if city else ""
    store = f" at store **#{store_number}**" if store_number else ""
    scope = (f" for **{test_type}**" if test_type else "") + loc + store

    if intent == "FAILURE_RATE":
        if not rows:
            return f"No compliance test records found{scope}."
        total = sum(r.get("cnt", 0) for r in rows)
        fail_count = next((r.get("cnt", 0) for r in rows if str(r.get("status", "")).upper() == "FAIL"), 0)
        pct = round((fail_count / total) * 100, 1) if total else 0
        breakdown = ", ".join(f"**{r.get('status', 'Unknown')}**: {r.get('cnt', 0)}" for r in rows)
        target = test_type or "all tests"
        return (
            f"The failure rate for **{target}**{loc}{store} is **{pct}%**.\n"
            f"• Total tests analyzed: **{total}** ({fail_count} failed)\n"
            f"• Breakdown: {breakdown}"
        )

    if intent == "STATUS_COUNTS":
        if not rows:
            return f"No matching test records found{scope}."
        breakdown = ", ".join(f"**{r.get('status', 'Unknown')}**: {r.get('cnt', 0)}" for r in rows)
        total = sum(r.get("cnt", 0) for r in rows)
        target = test_type or "all compliance tests"
        filter_str = f" matching **{status_filter.upper()}**" if status_filter else ""
        return f"Status counts for **{target}**{filter_str}{loc}{store}: {breakdown} (Total: **{total}**)."

    if intent == "SUMMARY":
        if not rows:
            return f"No summary data available{scope}."
        lines = [f"**Compliance Summary Overview**{loc}{store}:\n"]
        total_tests = 0
        total_fails = 0
        for r in rows:
            test_name = r.get("test", "Test")
            tot = r.get("total", 0)
            passed = r.get("pass_count", 0)
            failed = r.get("fail_count", 0)
            pending = r.get("pending_count", 0)
            total_tests += tot
            total_fails += failed
            pct = round((passed / tot) * 100) if tot else 0
            dots = "🟢" if pct >= 80 else ("🟡" if pct >= 50 else "🔴")
            pending_text = f", {pending} pending" if pending else ""
            lines.append(f"• {dots} **{test_name}**: {passed}/{tot} passed ({pct}% pass rate, {failed} failed{pending_text})")

        overall_pct = round(((total_tests - total_fails) / total_tests) * 100, 1) if total_tests else 0
        lines.append(f"\nOverall system pass rate: **{overall_pct}%** across **{total_tests}** total evaluations.")
        return "\n".join(lines)

    if intent == "LIST_RECORDS":
        if not rows:
            return f"No records found{scope}."
        count = len(rows)
        return f"Found **{count}** matching compliance record(s){loc}{store}. See the table below for details."

    if intent == "EXPIRING_SOON":
        if not rows:
            return "No certificates or insurance policies are expiring in the specified timeframe."
        total = sum(r.get("cnt", 0) for r in rows)
        parts = [f"**{r.get('type')}**: {r.get('cnt')}" for r in rows]
        return f"Found **{total}** certificate(s) / policy(ies) expiring soon:\n• " + "\n• ".join(parts)

    if intent == "OVERDUE":
        if not rows:
            return "Great news! No certificates or insurance policies are currently overdue."
        total = sum(r.get("cnt", 0) for r in rows)
        parts = []
        for r in rows:
            earliest = f" (oldest lapsed on {r.get('earliest')})" if r.get("earliest") else ""
            parts.append(f"**{r.get('type')}**: {r.get('cnt')} overdue{earliest}")
        return f"⚠️ Warning: **{total}** overdue item(s) require immediate renewal:\n• " + "\n• ".join(parts)

    if intent == "CHART_DATA":
        if not rows:
            return f"No chart data available{scope}."
        chart_name = chart_type or "visualization"
        return f"Here is the requested **{chart_name}** for your compliance data{scope}."

    return "Query processed successfully."

