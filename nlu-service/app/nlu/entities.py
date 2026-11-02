import re
from datetime import date, timedelta
from typing import Optional, Tuple
import calendar

import dateparser
from rapidfuzz import process


def extract_date_range(question: str) -> Optional[Tuple[date, date]]:
    """Extract explicit date range from question."""
    q = question.strip()
    try:
        # Pattern 1: from X to Y
        m = re.search(r"\bfrom\s+(.+?)\s+to\s+(.+?)(?:$|[.,?])", q, re.IGNORECASE)
        if m:
            start = dateparser.parse(m.group(1))
            end = dateparser.parse(m.group(2))
            if start and end:
                return (start.date(), end.date())

        # Pattern 2: between X and Y
        m = re.search(r"\bbetween\s+(.+?)\s+and\s+(.+?)(?:$|[.,?])", q, re.IGNORECASE)
        if m:
            start = dateparser.parse(m.group(1))
            end = dateparser.parse(m.group(2))
            if start and end:
                return (start.date(), end.date())

        # Pattern 3: in Month Year
        m = re.search(r"\b(?:in\s+)?([A-Za-z]+)\s+(\d{4})\b", q)
        if m:
            month = m.group(1)
            year = int(m.group(2))
            start = dateparser.parse(f"1 {month} {year}")
            if start:
                _, last_day = calendar.monthrange(year, start.month)
                return (start.date(), date(year, start.month, last_day))

        # Pattern 4: in Year
        m = re.search(r"\b(?:in\s+)(\d{4})\b", q)
        if m:
            year = int(m.group(1))
            return (date(year, 1, 1), date(year, 12, 31))

        # Pattern 5: past / last N months
        m = re.search(r"\b(?:past|last)\s+(\d+)\s+months?\b", q, re.IGNORECASE)
        if m:
            months = int(m.group(1))
            today = date.today()
            # Approx 30 days per month
            start_date = today - timedelta(days=months * 30)
            return (start_date, today)

    except Exception:
        pass

    return None


def extract_month(question: str) -> Optional[Tuple[date, date]]:
    """Extract month when no year is explicitly specified."""
    try:
        months_pattern = r"\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b"
        m = re.search(months_pattern, question, re.IGNORECASE)
        if not m:
            return None

        month_name = m.group(1)
        today = date.today()
        year = today.year
        start = dateparser.parse(f"1 {month_name} {year}")
        if not start:
            return None

        _, last_day = calendar.monthrange(year, start.month)
        return (start.date(), date(year, start.month, last_day))
    except Exception:
        pass
    return None


def extract_city(question: str, known_cities: list[str]) -> Optional[str]:
    """
    Extract city using word/bigram fuzzy matching against known database cities.
    Avoids matching arbitrary English words against city names.
    """
    if not known_cities:
        return None

    # Check exact case-insensitive matches first
    q_lower = f" {question.lower()} "
    for city in known_cities:
        pattern = r"\b" + re.escape(city.lower()) + r"\b"
        if re.search(pattern, q_lower):
            return city

    # Fallback to word and 2-word ngrams with higher fuzzy confidence threshold (>= 88)
    words = re.findall(r"[A-Za-z0-9]+", question)
    candidates = []
    for i in range(len(words)):
        candidates.append(words[i])
        if i + 1 < len(words):
            candidates.append(f"{words[i]} {words[i+1]}")

    best_match = None
    best_score = 0
    for cand in candidates:
        if len(cand) < 3:
            continue
        # Skip common conversational words
        if cand.lower() in {"show", "list", "chart", "rate", "failure", "tests", "what", "where", "store", "records"}:
            continue

        result = process.extractOne(cand, known_cities)
        if result and result[1] >= 88:
            if result[1] > best_score:
                best_score = result[1]
                best_match = result[0]

    return best_match


def extract_n_days(question: str, default: int = 30) -> int:
    """Extract number of days for expiration or overdue queries."""
    q = question.lower()

    # Pattern: next/within/in N days
    m = re.search(r"\b(?:next|within|in)\s+(\d+)\s+days?\b", q)
    if m:
        return max(1, min(365, int(m.group(1))))

    # Pattern: N weeks
    m = re.search(r"\b(\d+)\s+weeks?\b", q)
    if m:
        return max(1, min(365, int(m.group(1)) * 7))

    # Pattern: N months
    m = re.search(r"\b(\d+)\s+months?\b", q)
    if m:
        return max(1, min(365, int(m.group(1)) * 30))

    # Pattern: bare N days
    m = re.search(r"\b(\d+)\s+days?\b", q)
    if m:
        return max(1, min(365, int(m.group(1))))

    return default
