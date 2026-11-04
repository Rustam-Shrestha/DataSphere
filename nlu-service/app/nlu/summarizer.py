"""
Summarizer module: converts query results and metadata into clear, informative answers.
Handles any custom status, distinguishes scalar answers from visual dashboards,
and calculates accurate meaningful pass/fail rates.
"""

from typing import Optional, List, Dict, Any


def _get_status_count(rows: List[Dict[str, Any]], status_name: str) -> int:
    s_upper = status_name.upper().strip()
    return next((int(r.get("cnt", 0)) for r in rows if str(r.get("status", "")).upper().strip() == s_upper), 0)


def build_text_answer(
    intent: str,
    rows: List[Dict[str, Any]],
    test_type: Optional[str] = None,
    city: Optional[str] = None,
    store_number: Optional[int] = None,
    status_filter: Optional[str] = None,
    chart_type: Optional[str] = None,
    has_chart: bool = False,
) -> str:
    """Build a natural, accurate answer describing the SQL query output."""
    loc = f" in **{city}**" if city else ""
    store = f" at store **#{store_number}**" if store_number else ""
    scope = (f" for **{test_type}**" if test_type else "") + loc + store

    if intent == "FAILURE_RATE":
        if not rows:
            return f"No compliance test records found{scope}."

        total_records = sum(int(r.get("cnt", 0)) for r in rows)
        pass_count = _get_status_count(rows, "PASS")
        fail_count = _get_status_count(rows, "FAIL")
        pending_count = _get_status_count(rows, "PENDING")
        other_rows = [
            r for r in rows
            if str(r.get("status", "")).upper().strip() not in ("PASS", "FAIL", "PENDING")
        ]
        other_count = sum(int(r.get("cnt", 0)) for r in other_rows)

        # Meaningful denominator for pass/fail rate is valid evaluated tests (PASS + FAIL)
        evaluated = pass_count + fail_count
        fail_pct = round((fail_count / evaluated) * 100, 1) if evaluated else 0.0
        pass_pct = round((pass_count / evaluated) * 100, 1) if evaluated else 0.0

        target = test_type or "all compliance tests"

        # Concise scalar answer
        res = (
            f"The failure rate for **{target}**{loc}{store} is **{fail_pct}%** "
            f"({fail_count} failed out of {evaluated} evaluated tests). "
            f"The pass rate is **{pass_pct}%** ({pass_count} passed)."
        )

        extras = []
        if pending_count > 0:
            extras.append(f"**{pending_count}** pending")
        if other_count > 0:
            custom_breakdown = ", ".join(f"**{r.get('status')}**: {r.get('cnt')}" for r in other_rows)
            extras.append(f"**{other_count}** with other statuses ({custom_breakdown})")

        if extras:
            res += f"\n• Additional records: " + "; ".join(extras) + f". (Total recorded: **{total_records}**)"

        return res

    if intent == "STATUS_COUNTS":
        if not rows:
            return f"No matching test records found{scope}."

        target = test_type or "all compliance tests"

        # If a specific status was requested (e.g. "how many failures")
        if status_filter:
            sf_upper = status_filter.upper()
            if sf_upper == "OTHER":
                other_count = sum(
                    int(r.get("cnt", 0)) for r in rows
                    if str(r.get("status", "")).upper().strip() not in ("PASS", "FAIL")
                )
                breakdown = ", ".join(
                    f"**{r.get('status')}**: {r.get('cnt')}" for r in rows
                    if str(r.get("status", "")).upper().strip() not in ("PASS", "FAIL")
                )
                return f"There are **{other_count}** test record(s) with neither PASS nor FAIL for **{target}**{loc}{store} ({breakdown})."

            matched_cnt = _get_status_count(rows, sf_upper)
            # If the query itself was an aggregated UNION leg returning single row
            if len(rows) == 1 and "cnt" in rows[0] and str(rows[0].get("status", "")).upper() == sf_upper:
                matched_cnt = int(rows[0]["cnt"])

            total_all = sum(int(r.get("cnt", 0)) for r in rows)
            ratio_note = f" (out of {total_all} total recorded)" if total_all > matched_cnt else ""
            return f"There are **{matched_cnt}** {sf_upper} result(s) for **{target}**{loc}{store}{ratio_note}."

        # No specific status filter -> full breakdown
        total = sum(int(r.get("cnt", 0)) for r in rows)
        breakdown = ", ".join(f"**{r.get('status', 'Unknown')}**: {r.get('cnt', 0)}" for r in rows)
        return f"Status counts for **{target}**{loc}{store}: {breakdown} (Total: **{total}**)."

    if intent == "SUMMARY":
        if not rows:
            return f"No summary data available{scope}."
        lines = [f"**Compliance Summary Overview**{loc}{store}:\n"]
        total_tests = 0
        total_eval = 0
        total_fails = 0
        total_passes = 0
        total_other = 0

        for r in rows:
            test_name = r.get("test", "Test")
            tot = int(r.get("total", 0))
            passed = int(r.get("pass_count", 0))
            failed = int(r.get("fail_count", 0))
            pending = int(r.get("pending_count", 0))
            other = int(r.get("other_count", 0))

            total_tests += tot
            total_eval += (passed + failed)
            total_passes += passed
            total_fails += failed
            total_other += (pending + other)

            eval_sub = passed + failed
            pct = round((passed / eval_sub) * 100) if eval_sub else 0
            dots = "🟢" if pct >= 80 else ("🟡" if pct >= 50 else "🔴")

            other_notes = []
            if pending > 0:
                other_notes.append(f"{pending} pending")
            if other > 0:
                other_notes.append(f"{other} custom/other")
            other_text = f", {', '.join(other_notes)}" if other_notes else ""

            lines.append(
                f"• {dots} **{test_name}**: {passed}/{eval_sub} passed "
                f"({pct}% pass rate, {failed} failed{other_text})"
            )

        overall_pct = round((total_passes / total_eval) * 100, 1) if total_eval else 0.0
        lines.append(
            f"\nOverall system pass rate: **{overall_pct}%** across **{total_eval}** evaluated tests "
            f"({total_fails} failures, {total_other} non-evaluated/pending)."
        )
        return "\n".join(lines)

    if intent == "LIST_RECORDS":
        if not rows:
            return f"No records found{scope}."
        count = len(rows)
        return f"Found **{count}** matching compliance record(s){loc}{store}. See the table below for details."

    if intent == "EXPIRING_SOON":
        if not rows:
            return "No certificates or insurance policies are expiring in the specified timeframe."
        total = sum(int(r.get("cnt", 0)) for r in rows)
        parts = [f"**{r.get('type')}**: {r.get('cnt')}" for r in rows]
        return f"Found **{total}** certificate(s) / policy(ies) expiring soon:\n• " + "\n• ".join(parts)

    if intent == "OVERDUE":
        if not rows:
            return "Great news! No certificates or insurance policies are currently overdue."
        total = sum(int(r.get("cnt", 0)) for r in rows)
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
