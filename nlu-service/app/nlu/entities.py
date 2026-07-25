import re
from datetime import date
from typing import Optional

import dateparser
from rapidfuzz import process


def extract_date_range(question: str) -> Optional[tuple[date, date]]:
    m = re.search(r"from\s+(.+?)\s+to\s+(.+?)(?:$|[.,?])", question)
    if not m:
        m = re.search(r"between\s+(.+?)\s+and\s+(.+?)(?:$|[.,?])", question)
    if not m:
        m = re.search(r"(?:in\s+)?([A-Z][a-z]+)\s+(\d{4})", question)
        if m:
            month = m.group(1)
            year = m.group(2)
            start = dateparser.parse(f"1 {month} {year}")
            end = dateparser.parse(f"1 {month} {year}")
            if start and end:
                import calendar
                _, last_day = calendar.monthrange(end.year, end.month)
                return (start.date(), date(end.year, end.month, last_day))
        return None

    start = dateparser.parse(m.group(1))
    end = dateparser.parse(m.group(2))

    if start and end:
        return (start.date(), end.date())

    return None


def extract_month(question: str) -> Optional[tuple[date, date]]:
    m = re.search(r"(?:in\s+)?([A-Z][a-z]+)(?:\s+(\d{4}))?", question)
    if not m:
        return None
    import calendar
    month_name = m.group(1)
    year = int(m.group(2)) if m.group(2) else 2026
    start = dateparser.parse(f"1 {month_name} {year}")
    if not start:
        return None
    _, last_day = calendar.monthrange(year, start.month)
    return (start.date(), date(year, start.month, last_day))


def extract_city(question: str, known_cities: list[str]) -> Optional[str]:
    result = process.extractOne(question, known_cities)
    if result and result[1] >= 80:
        return result[0]
    return None
